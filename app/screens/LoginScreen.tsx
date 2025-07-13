import { observer } from "mobx-react-lite";
import { ComponentType, FC, useEffect, useMemo, useRef, useState } from "react";
// eslint-disable-next-line no-restricted-imports
import { Alert, TextInput, TextStyle, ViewStyle } from "react-native";
import {
  Button,
  PressableIcon,
  Screen,
  Text,
  TextField,
  TextFieldAccessoryProps,
} from "../components";
import { useStores } from "../models";
import { AppStackScreenProps } from "@/navigators/types";
import type { ThemedStyle } from "@/theme";
import { useAppTheme } from "@/utils/useAppTheme";
import { useHeader } from "@/utils/useHeader";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppStackParamList } from "../navigators";

interface LoginScreenProps extends AppStackScreenProps<"Login"> {}

const emailValidator = (email: string): string | undefined => {
  if (!email.length) return "Please enter a valid email address";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid Email";
  return undefined;
};

const passwordValidator = (password: string): string | undefined => {
  if (!password.length) return "Please enter a valid password";
  return undefined;
};

export const LoginScreen: FC<LoginScreenProps> = observer(function LoginScreen(
  _props
) {
  const navigation = useNavigation<
    NativeStackNavigationProp<AppStackParamList>
  >();
  const authPasswordInput = useRef<TextInput>(null);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const {
    authenticationStore: {
      authEmail,
      setAuthEmail,
      authPassword,
      setAuthPassword,
      setAuthToken,
      validationError,
      login,
    },
  } = useStores();

  const register = () => {
    navigation.navigate("SignUp");
    setAuthEmail("");
    setAuthPassword("");
  };

  useHeader(
    {
      leftIcon: "back",
      onLeftPress: () => {
        navigation.goBack();
        setAuthEmail("");
        setAuthPassword("");
      },
      title: "Log In",
    },
    [navigation]
  );

  const {
    themed,
    theme: { colors },
  } = useAppTheme();

  // const error = isSubmitted ? validationError : "";
  async function onSubmit() {
    try {
      setIsSubmitted(true);
      setAttemptsCount(attemptsCount + 1);

      setEmailError(undefined);
      setPasswordError(undefined);

      // Validate email
      const emailValidationError = emailValidator(authEmail);
      if (emailValidationError) {
        setEmailError(emailValidationError);
        return; // Don't throw, just return early
      }

      // Validate password
      const passwordValidationError = passwordValidator(authPassword);
      if (passwordValidationError) {
        setPasswordError(passwordValidationError);
        return; // Don't throw, just return early
      }

      // Early return if validation fails
      if (validationError) {
        setIsSubmitted(false);
        return;
      }

      console.log("Validation passed, attempting login...");

      // Attempt login
      const result = await login();

      if (result.success) {
        console.log("Login successful");

        // Reset form fields on success
        setIsSubmitted(false);
        setAuthPassword("");
        setAuthEmail("");

        // Navigate to the next screen
        navigation.navigate("Demo", { screen: "DemoCommunity" });
      } else {
        // Login failed - keep form populated for retry
        setIsSubmitted(false);

        const errorMessage = result.error || "Login failed. Please try again.";
        console.error("Login failed:", errorMessage);

        // Optional: Show alert for login failure
        Alert.alert("Login Failed", errorMessage, [
          {
            text: "OK",
            onPress: () => console.log("Login error acknowledged"),
          },
        ]);
      }
    } catch (error) {
      // Handle unexpected errors
      setIsSubmitted(false);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during login";

      console.error("Login error:", errorMessage);

      // Optional: Show alert for unexpected errors
      Alert.alert("Login Error", errorMessage, [
        {
          text: "OK",
          onPress: () => console.log("Unexpected error acknowledged"),
        },
      ]);
    }
  }

  const PasswordRightAccessory: ComponentType<TextFieldAccessoryProps> = useMemo(
    () =>
      function PasswordRightAccessory(props: TextFieldAccessoryProps) {
        return (
          <PressableIcon
            icon={isAuthPasswordHidden ? "view" : "hidden"}
            color={colors.palette.neutral800}
            containerStyle={props.style}
            size={20}
            onPress={() => setIsAuthPasswordHidden(!isAuthPasswordHidden)}
          />
        );
      },
    [isAuthPasswordHidden, colors.palette.neutral800]
  );

  return (
    <Screen
      preset="auto"
      contentContainerStyle={themed($screenContentContainer)}
      safeAreaEdges={["top", "bottom"]}
    >
      <Text
        testID="login-heading"
        tx="loginScreen:logIn"
        preset="heading"
        style={themed($logIn)}
      />
      <Text
        tx="loginScreen:enterDetails"
        preset="subheading"
        style={themed($enterDetails)}
      />
      <Text tx="loginScreen:toRegister" style={themed($loginText)} />
      <Text
        text="Register"
        style={[themed($loginText), themed($loginLink)]}
        onPress={register}
      />
      {attemptsCount > 2 && (
        <Text
          tx="loginScreen:hint"
          size="sm"
          weight="light"
          style={themed($hint)}
        />
      )}

      <TextField
        value={authEmail}
        onChangeText={setAuthEmail}
        containerStyle={themed($textField)}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        labelTx="loginScreen:emailFieldLabel"
        placeholderTx="loginScreen:emailFieldPlaceholder"
        helper={emailError}
        status={emailError ? "error" : undefined}
        onSubmitEditing={() => authPasswordInput.current?.focus()}
      />

      <TextField
        ref={authPasswordInput}
        value={authPassword}
        onChangeText={setAuthPassword}
        containerStyle={themed($textField)}
        autoCapitalize="none"
        autoComplete="password"
        autoCorrect={false}
        secureTextEntry={isAuthPasswordHidden}
        labelTx="loginScreen:passwordFieldLabel"
        placeholderTx="loginScreen:passwordFieldPlaceholder"
        helper={passwordError}
        status={passwordError ? "error" : undefined}
        onSubmitEditing={async () => {
          if (!authEmail || !authPassword) return;
          await setAuthToken(authEmail, authPassword);
          setIsSubmitted(true);
          navigation.navigate("Demo", { screen: "DemoCommunity" });
        }}
        RightAccessory={PasswordRightAccessory}
      />

      <Button
        testID="login-button"
        tx="loginScreen:tapToLogIn"
        style={themed($tapButton)}
        preset="reversed"
        onPress={onSubmit}
      />
    </Screen>
  );
});

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.xl,
  paddingHorizontal: spacing.lg,
});

const $logIn: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
});

const $enterDetails: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
});

const $hint: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
  marginBottom: spacing.md,
});

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
});

const $tapButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
});

const $loginText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  // color: colors.tint,
  // marginBottom: spacing.md,
  textAlign: "center",
});

const $loginLink: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  // color: colors.tint,
  color: colors.tint,
  marginBottom: spacing.md,
});
