import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const STORAGE_KEY_API_KEY = "LOCAL_PLATES_OPENAI_API_KEY";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  isError?: boolean;
}

const QUICK_PROMPTS = [
  "🍛 Authentic Jaffna Crab Curry recipe with spices",
  "🍲 Step-by-step Woodfired Chicken Dum Biryani",
  "🥘 15-minute quick dinner recipe with eggs and onion",
  "🥗 High-protein vegetarian Buddha Bowl recipe",
  "🍮 Traditional Sri Lankan Kithul Jaggery Watalappam",
  "🥟 Crispy Sri Lankan Fish Patties with potato & leeks",
  "🍝 Creamy garlic butter pasta from scratch",
  "🥞 Fluffy buttermilk pancakes with homemade berry syrup",
];

const SYSTEM_PROMPT = `You are ChefAI, an elite culinary chef and master recipe assistant for the Local Plates food platform.
Your mission is to provide accurate, authentic, and delicious recipes, step-by-step cooking techniques, ingredient substitutions, and culinary advice.

When a user asks for a recipe or cooking advice:
1. Provide an appetizing dish title.
2. Include: ⏱️ Prep Time | 🍳 Cook Time | 👥 Servings | 📊 Difficulty.
3. List all ingredients with exact measurements.
4. Give clear, numbered step-by-step cooking instructions.
5. Include 💡 Chef's Secret Tips (flavour elevation, searing tricks, or spice balance).
6. Provide dietary substitutions or allergen notes when relevant.

Use clean markdown formatting (bold headers, bullet points, numbered lists, and appropriate emojis). Keep answers clear, culinary-accurate, and engaging.`;

export default function ChatScreen() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState<string>("");
  const [tempApiKeyInput, setTempApiKeyInput] = useState<string>("");
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [showKeyPassword, setShowKeyPassword] = useState<boolean>(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "👋 **Hello! I'm ChefAI**, connected directly to OpenAI to bring you Michelin-quality recipes, ingredient guides, and authentic homemade cooking instructions.\n\nAsk me for any dish, step-by-step cooking guide, ingredient substitution, or what you can cook with items in your fridge!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load API key from AsyncStorage or process.env
  useEffect(() => {
    async function loadKey() {
      try {
        const storedKey = await AsyncStorage.getItem(STORAGE_KEY_API_KEY);
        if (storedKey && storedKey.trim()) {
          setApiKey(storedKey.trim());
          setTempApiKeyInput(storedKey.trim());
        } else if (process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
          setApiKey(process.env.EXPO_PUBLIC_OPENAI_API_KEY.trim());
          setTempApiKeyInput(process.env.EXPO_PUBLIC_OPENAI_API_KEY.trim());
        }
      } catch (err) {
        console.warn("Failed to load API key from storage", err);
      }
    }
    loadKey();
  }, []);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isTyping]);

  const handleSaveApiKey = async () => {
    const trimmed = tempApiKeyInput.trim();
    if (!trimmed) {
      Alert.alert("API Key Required", "Please enter a valid OpenAI API key starting with 'sk-'.");
      return;
    }
    try {
      await AsyncStorage.setItem(STORAGE_KEY_API_KEY, trimmed);
      setApiKey(trimmed);
      setShowKeyModal(false);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      Alert.alert("Key Saved", "Your OpenAI API Key has been saved! You can now generate live recipes.");
    } catch (err) {
      Alert.alert("Error", "Failed to save API key. Please try again.");
    }
  };

  const handleClearApiKey = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_API_KEY);
      setApiKey("");
      setTempApiKeyInput("");
      setShowKeyModal(false);
      Alert.alert("Key Cleared", "OpenAI API Key removed.");
    } catch (err) {}
  };

  const callOpenAIChat = async (userPrompt: string, history: Message[]): Promise<string> => {
    const keyToUse = apiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY;

    if (!keyToUse || !keyToUse.trim()) {
      setShowKeyModal(true);
      throw new Error(
        "🔑 **OpenAI API Key Missing**\n\nPlease tap the **'API Key'** button at the top and enter your OpenAI API key (starts with `sk-...`) to connect live to GPT-4o."
      );
    }

    // Build context payload with recent history
    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history
        .filter((m) => !m.isError && m.id !== "welcome-1")
        .slice(-6)
        .map((m) => ({
          role: m.role,
          content: m.content,
        })),
      { role: "user", content: userPrompt },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${keyToUse.trim()}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      let errorDetails = `HTTP ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson.error?.message) {
          errorDetails = errorJson.error.message;
        }
      } catch (e) {}

      if (response.status === 401) {
        throw new Error(`🚫 **OpenAI Authorization Failed (401)**\n\nYour API key appears to be invalid or expired: "${errorDetails}".\n\nPlease tap the **API Key** button in the header to update your key.`);
      } else if (response.status === 429) {
        throw new Error(`⚠️ **OpenAI Rate Limit / Quota Exceeded (429)**\n\n${errorDetails}.\n\nPlease verify your OpenAI account billing or credits at platform.openai.com.`);
      } else {
        throw new Error(`⚠️ **OpenAI Error (${response.status})**\n\n${errorDetails}`);
      }
    }

    const data = await response.json();
    if (data.choices && data.choices[0]?.message?.content) {
      return data.choices[0].message.content.trim();
    } else {
      throw new Error("Received empty response from OpenAI.");
    }
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || inputText;
    if (!textToSend.trim() || isTyping) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const currentHistory = [...messages, userMessage];
    setMessages(currentHistory);
    if (!customText) setInputText("");
    setIsTyping(true);

    try {
      const botResponse = await callOpenAIChat(textToSend.trim(), messages);
      setIsTyping(false);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: botResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMessage]);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch (err: any) {
      setIsTyping(false);
      const errorMessageText = err?.message || "Failed to communicate with OpenAI API.";

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: errorMessageText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isError: true,
        },
      ]);
    }
  };

  const handleShareRecipe = async (recipeText: string) => {
    try {
      await Share.share({
        message: `${recipeText}\n\nShared from Local Plates ChefAI 🍽️`,
      });
    } catch (e) {}
  };

  const hasConfiguredKey = Boolean(apiKey || process.env.EXPO_PUBLIC_OPENAI_API_KEY);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.botAvatarBadge}>
            <Ionicons name="sparkles" size={18} color="#fff" />
          </View>
          <View>
            <View style={styles.botNameRow}>
              <Text style={styles.headerTitle}>ChefAI Recipe Bot</Text>
              <View style={[styles.onlinePill, !hasConfiguredKey && styles.offlinePill]}>
                <View style={[styles.onlineDot, !hasConfiguredKey && styles.offlineDot]} />
                <Text style={[styles.onlineText, !hasConfiguredKey && styles.offlineText]}>
                  {hasConfiguredKey ? "OpenAI Connected" : "API Key Needed"}
                </Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>Powered by OpenAI GPT-4o-mini Food Intelligence</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowKeyModal(true)}
            style={[styles.keyConfigBtn, !hasConfiguredKey && styles.keyConfigBtnPulse]}
            activeOpacity={0.8}
          >
            <Ionicons name="key-outline" size={16} color={hasConfiguredKey ? "#059669" : "#FF3366"} />
            <Text style={[styles.keyConfigText, { color: hasConfiguredKey ? "#059669" : "#FF3366" }]}>
              {hasConfiguredKey ? "API Key" : "Add Key"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              setMessages([
                {
                  id: "welcome-reset",
                  role: "assistant",
                  content: "✨ Chat cleared! What delicious recipe or cooking technique would you like to explore?",
                  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
              ])
            }
            style={styles.clearChatBtn}
          >
            <Feather name="refresh-cw" size={15} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Banner if no OpenAI Key configured */}
      {!hasConfiguredKey && (
        <TouchableOpacity
          style={styles.noKeyBanner}
          onPress={() => setShowKeyModal(true)}
          activeOpacity={0.9}
        >
          <View style={styles.noKeyBannerIcon}>
            <Ionicons name="key" size={16} color="#FF3366" />
          </View>
          <View style={styles.noKeyBannerContent}>
            <Text style={styles.noKeyBannerTitle}>OpenAI API Key Required for Live Recipes</Text>
            <Text style={styles.noKeyBannerSub}>
              Tap here to enter your OpenAI API key and unlock unlimited chef-crafted recipes.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#FF3366" />
        </TouchableOpacity>
      )}

      {/* Suggested Quick Prompt Chips */}
      <View style={styles.promptsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptsScroll}>
          {QUICK_PROMPTS.map((prompt, i) => (
            <TouchableOpacity
              key={i}
              style={styles.promptChip}
              onPress={() => handleSend(prompt)}
              activeOpacity={0.75}
            >
              <Text style={styles.promptChipText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <View
              key={msg.id}
              style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowBot]}
            >
              {!isUser && (
                <View style={[styles.botMessageAvatar, msg.isError && styles.botMessageAvatarError]}>
                  <Ionicons
                    name={msg.isError ? "alert-circle" : "restaurant"}
                    size={14}
                    color={msg.isError ? "#EF4444" : "#FF3366"}
                  />
                </View>
              )}

              <View
                style={[
                  styles.messageBubble,
                  isUser
                    ? styles.messageBubbleUser
                    : msg.isError
                    ? styles.messageBubbleError
                    : styles.messageBubbleBot,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isUser
                      ? styles.messageTextUser
                      : msg.isError
                      ? styles.messageTextError
                      : styles.messageTextBot,
                  ]}
                  selectable
                >
                  {msg.content}
                </Text>

                <View style={styles.messageFooter}>
                  <Text
                    style={[
                      styles.messageTime,
                      isUser ? styles.messageTimeUser : styles.messageTimeBot,
                    ]}
                  >
                    {msg.timestamp}
                  </Text>
                  {!isUser && !msg.isError && (
                    <TouchableOpacity
                      onPress={() => handleShareRecipe(msg.content)}
                      style={styles.shareRecipeBtn}
                    >
                      <Ionicons name="share-social-outline" size={13} color="#666" />
                      <Text style={styles.shareRecipeText}>Share Recipe</Text>
                    </TouchableOpacity>
                  )}
                  {!isUser && msg.isError && (
                    <TouchableOpacity
                      onPress={() => setShowKeyModal(true)}
                      style={[styles.shareRecipeBtn, { backgroundColor: "#FEE2E2" }]}
                    >
                      <Ionicons name="key" size={12} color="#DC2626" />
                      <Text style={[styles.shareRecipeText, { color: "#DC2626" }]}>Configure Key</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        })}

        {isTyping && (
          <View style={[styles.messageRow, styles.messageRowBot]}>
            <View style={styles.botMessageAvatar}>
              <Ionicons name="restaurant" size={14} color="#FF3366" />
            </View>
            <View style={[styles.messageBubble, styles.messageBubbleBot, styles.typingBubble]}>
              <ActivityIndicator size="small" color="#FF3366" />
              <Text style={styles.typingText}>ChefAI is crafting your recipe via OpenAI...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={styles.inputBar}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask for recipes, ingredients, techniques..."
              placeholderTextColor="#888"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={600}
              onSubmitEditing={() => handleSend()}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim().length > 0 && !isTyping
                ? styles.sendButtonActive
                : styles.sendButtonDisabled,
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isTyping}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* OpenAI API Key Configuration Modal */}
      <Modal
        visible={showKeyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowKeyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <View style={styles.keyIconCircle}>
                  <Ionicons name="key" size={20} color="#FF3366" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>OpenAI API Configuration</Text>
                  <Text style={styles.modalSubtitle}>Connect live GPT-4o for chef recipes</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowKeyModal(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInstruction}>
              Enter your OpenAI API key below. The key is stored securely on your local device and used exclusively to generate real-time culinary responses from OpenAI models.
            </Text>

            <View style={styles.keyInputContainer}>
              <TextInput
                style={styles.keyInput}
                placeholder="sk-proj-..."
                placeholderTextColor="#9CA3AF"
                value={tempApiKeyInput}
                onChangeText={setTempApiKeyInput}
                secureTextEntry={!showKeyPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowKeyPassword(!showKeyPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showKeyPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.helperText}>
              💡 Get your API key at <Text style={styles.linkText}>platform.openai.com/api-keys</Text>
            </Text>

            <View style={styles.modalBtnRow}>
              {Boolean(apiKey) && (
                <TouchableOpacity onPress={handleClearApiKey} style={styles.clearKeyBtn}>
                  <Text style={styles.clearKeyText}>Remove</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleSaveApiKey}
                style={[styles.saveKeyBtn, !Boolean(apiKey) && { flex: 1 }]}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.saveKeyText}>Save & Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F2",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  botAvatarBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FF3366",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF3366",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  botNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
  },
  onlinePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  offlinePill: {
    backgroundColor: "#FEF2F2",
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  offlineDot: {
    backgroundColor: "#EF4444",
  },
  onlineText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  offlineText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#DC2626",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  keyConfigBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  keyConfigBtnPulse: {
    backgroundColor: "#FFF1F2",
    borderColor: "#FFE4E6",
  },
  keyConfigText: {
    fontSize: 11,
    fontWeight: "700",
  },
  clearChatBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  noKeyBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF1F2",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE4E6",
    gap: 12,
  },
  noKeyBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFE4E6",
    justifyContent: "center",
    alignItems: "center",
  },
  noKeyBannerContent: {
    flex: 1,
  },
  noKeyBannerTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E11D48",
  },
  noKeyBannerSub: {
    fontSize: 11,
    color: "#9F1239",
    marginTop: 1,
  },
  promptsContainer: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F2",
  },
  promptsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  promptChip: {
    backgroundColor: "#FFF0F3",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFE0E6",
    marginRight: 6,
  },
  promptChipText: {
    fontSize: 12,
    color: "#FF3366",
    fontWeight: "600",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "flex-end",
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowBot: {
    justifyContent: "flex-start",
  },
  botMessageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF0F3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginBottom: 4,
  },
  botMessageAvatarError: {
    backgroundColor: "#FEF2F2",
  },
  messageBubble: {
    maxWidth: "85%",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageBubbleUser: {
    backgroundColor: "#FF3366",
    borderBottomRightRadius: 4,
  },
  messageBubbleBot: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  messageBubbleError: {
    backgroundColor: "#FEF2F2",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
  },
  messageTextUser: {
    color: "#fff",
    fontWeight: "500",
  },
  messageTextBot: {
    color: "#1F2937",
  },
  messageTextError: {
    color: "#991B1B",
    fontWeight: "500",
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 4,
  },
  messageTime: {
    fontSize: 10,
  },
  messageTimeUser: {
    color: "rgba(255,255,255,0.75)",
  },
  messageTimeBot: {
    color: "#9CA3AF",
  },
  shareRecipeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
  },
  shareRecipeText: {
    fontSize: 10,
    color: "#4B5563",
    fontWeight: "600",
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  typingText: {
    fontSize: 13,
    color: "#6B7280",
    fontStyle: "italic",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#EEF0F2",
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    maxHeight: 100,
  },
  textInput: {
    fontSize: 14,
    color: "#111",
    fontWeight: "500",
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}),
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonActive: {
    backgroundColor: "#FF3366",
    shadowColor: "#FF3366",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 480,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  keyIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF0F3",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111",
  },
  modalSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  modalInstruction: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 19,
    marginBottom: 16,
  },
  keyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  keyInput: {
    flex: 1,
    height: 46,
    fontSize: 14,
    color: "#111",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as any) : {}),
  },
  eyeBtn: {
    padding: 6,
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 20,
  },
  linkText: {
    color: "#FF3366",
    fontWeight: "600",
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 10,
  },
  clearKeyBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  clearKeyText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 14,
  },
  saveKeyBtn: {
    flex: 2,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FF3366",
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#FF3366",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  saveKeyText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
