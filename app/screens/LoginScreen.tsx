import { observer } from "mobx-react-lite";
import { ComponentType, FC, useEffect, useMemo, useRef, useState } from "react";
// eslint-disable-next-line no-restricted-imports
import { TextInput, TextStyle, ViewStyle } from "react-native";
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

export const LoginScreen: FC<LoginScreenProps> = observer(function LoginScreen(
  _props
) {
  const navigation = useNavigation<
    NativeStackNavigationProp<AppStackParamList>
  >();
  const authPasswordInput = useRef<TextInput>(null);

  const [authPassword, setAuthPassword] = useState("");
  const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const {
    authenticationStore: {
      authEmail,
      setAuthEmail,
      setAuthToken,
      validationError,
    },
  } = useStores();

  const register = () => {
    navigation.navigate("SignUp")
  };

  useHeader(
    {
      leftIcon: "back",
      onLeftPress: () => navigation.goBack(),
      title: "Login"
    },
    [navigation]
  );

  const {
    themed,
    theme: { colors },
  } = useAppTheme();

  useEffect(() => {
    // Here is where you could fetch credentials from keychain or storage
    // and pre-fill the form fields.
    setAuthEmail("ignite@infinite.red");
    setAuthPassword("ign1teIsAwes0m3");

    // Return a "cleanup" function that React will run when the component unmounts
    return () => {
      setAuthPassword("");
      setAuthEmail("");
    };
  }, [setAuthEmail]);

  const error = isSubmitted ? validationError : "";

  function login() {
    setIsSubmitted(true);
    setAttemptsCount(attemptsCount + 1);

    if (validationError) return;

    // Make a request to your server to get an authentication token.
    // If successful, reset the fields and set the token.
    setIsSubmitted(false);
    setAuthPassword("");
    setAuthEmail("");

    // We'll mock this with a fake token.
    // Passing the current authPassword as the second argument
    setAuthToken(String(Date.now()), authPassword);
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
        helper={error}
        status={error ? "error" : undefined}
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
        onPress={login}
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
  textAlign: "center"
});

const $loginLink: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  // color: colors.tint,
  color: colors.tint,
  marginBottom: spacing.md,
});
