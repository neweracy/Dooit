import {
  FC,
  useRef,
  useState,
  useEffect,
  ComponentType,
  useMemo,
  useCallback,
} from "react";
import { observer } from "mobx-react-lite";
import { Alert, TextInput, TextStyle, ViewStyle } from "react-native";
import { AppStackScreenProps } from "@/navigators";
import {
  Button,
  PressableIcon,
  Screen,
  showQueuedAlert,
  Text,
  TextField,
  TextFieldAccessoryProps,
} from "@/components"; //
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useStores } from "@/models";
import { useHeader } from "@/utils/useHeader";
import type { ThemedStyle } from "@/theme";
import { useAppTheme } from "@/utils/useAppTheme";
import { AppStackParamList } from "../navigators";

interface SignUpScreenProps extends AppStackScreenProps<"SignUp"> {}

const emailValidator = (email: string): string | undefined => {
  if (!email.length) return "Please enter a valid email address";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid Email";
  return undefined;
};

const passwordValidator = (password: string): string | undefined => {
  if (!password.length) return "Please enter a valid password";
  return undefined;
};

const passwordConfirmValidator = (password: string): string | undefined => {
  if (!password.length) return "Please Confirm password";
  return undefined;
};

export const SignUpScreen: FC<SignUpScreenProps> = observer(
  function SignUpScreen() {
    const authPasswordInput = useRef<TextInput>(null);

    // const [authPassword, setAuthPassword] = useState("");
    const [authPasswordConfirm, setAuthPasswordConfirm] = useState("");
    const [isAuthPasswordHidden, setIsAuthPasswordHidden] = useState(true);
    // const [isAuthPasswordConfirmHidden, setIsAuthPasswordConfirmHidden] = useState(true);

    const [isPasswordConfirmHidden, setIsPasswordConfirmHidden] = useState(
      true
    );
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [attemptsCount, setAttemptsCount] = useState(0);

    const [emailError, setEmailError] = useState<string | undefined>();
    const [passwordError, setPasswordError] = useState<string | undefined>();
    const [passwordConfirmError, setPasswordConfirmError] = useState<
      string | undefined
    >();
    const [errors, setError] = useState<string | null>(null);

    const {
      authenticationStore: {
        authEmail,
        setAuthEmail,
        authPassword,
        setAuthPassword,
        validationError,
        signUp,
        checkServerStatus,
      },
    } = useStores();

    // Pull in navigation via hook
    const navigation = useNavigation<
      NativeStackNavigationProp<AppStackParamList>
    >();

    useHeader(
      {
        leftIcon: "back",
        onLeftPress: () => {
          navigation.navigate("ChooseAuth");
          setAuthEmail("");
          setAuthPassword("");
        },
        title: "Sign Up",
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
      if (authPassword.length > 1 && authPasswordConfirm.length > 1) {
        if (authPassword != authPasswordConfirm) {
          setPasswordConfirmError("Passwords do not match");
        } else {
          setPasswordConfirmError(undefined);
        }
      }

      // Return a "cleanup" function that React will run when the component unmounts
    }, [authPassword, authPasswordConfirm]);

    // const error = isSubmitted ? validationError : "";

    const toLogin = () => {
      navigation.goBack();
      setAuthEmail("");
      setAuthPassword("");
    };

    async function Register() {
      try {
        // Reset all error states
        setError(null);
        setEmailError(undefined);
        setPasswordError(undefined);

        if (authPassword.length <= 6) {
          showQueuedAlert({
            title: "Password Required",
            message:
              "Password must be more than 6 characters.\n Please try again.",
            buttons: [
              {
                text: "Cancel",
                onPress: () => {
                  console.log("Password too short alert dismissed");
                  setIsSubmitted(false);
                },
                style: "cancel",
              },
            ],
          });
          return;
        }

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

        const passwordConfirmValidationError = passwordConfirmValidator(
          authPasswordConfirm
        );
        if (passwordConfirmValidationError) {
          setPasswordConfirmError(passwordConfirmValidationError);
          return; // Don't throw, just return early
        }

        // Check for any additional validation errors
        if (validationError) {
          setError(validationError);
          return; // Don't throw, just return early
        }

        console.log("All validations passed, proceeding with registration");

        // Set loading state
        setIsSubmitted(true);
        setAttemptsCount(attemptsCount + 1);

        // Attempt registration
        const result = await signUp(authEmail);

        if (result.success) {
          console.log("Registration successful");

          // Reset form fields on success
          setIsSubmitted(false);
          setAuthPassword("");
          setAuthEmail("");
          setAuthPasswordConfirm("");

          // Optional: Show success message
          Alert.alert("Success", "Registration completed successfully!", [
            {
              text: "OK",
              onPress: () => {
                // Navigate to next screen or perform post-registration actions
                navigation.navigate("Demo", { screen: "DemoCommunity" });
              },
            },
          ]);
        } else {
          // Registration failed - keep form fields populated for retry
          setIsSubmitted(false);

          const errorMessage =
            result.error || "Registration failed. Please try again.";
          setError(errorMessage);

          console.error("Registration failed:", errorMessage);

          Alert.alert("Registration Failed", errorMessage, [
            {
              text: "OK",
              onPress: () => console.log("Registration error acknowledged"),
            },
          ]);
        }
      } catch (error) {
        // Handle unexpected errors
        setIsSubmitted(false);

        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during registration";

        console.error("Registration error:", errorMessage);
        setError(errorMessage);

        Alert.alert("Registration Error", errorMessage, [
          {
            text: "OK",
            onPress: () => console.log("Unexpected error acknowledged"),
          },
        ]);
      }
    }

    const createPasswordToggle = useCallback(
      (isHidden: boolean, setIsHidden: (hidden: boolean) => void) =>
        function PasswordToggle(props: TextFieldAccessoryProps) {
          return (
            <PressableIcon
              icon={isHidden ? "view" : "hidden"}
              color={colors.palette.neutral800}
              containerStyle={props.style}
              size={20}
              onPress={() => setIsHidden(!isHidden)}
            />
          );
        },
      [colors.palette.neutral800]
    );

    // Memoized accessories for both password fields
    const PasswordRightAccessory = useMemo(
      () => createPasswordToggle(isAuthPasswordHidden, setIsAuthPasswordHidden),
      [isAuthPasswordHidden, createPasswordToggle]
    );

    const PasswordConfirmRightAccessory = useMemo(
      () =>
        createPasswordToggle(
          isPasswordConfirmHidden,
          setIsPasswordConfirmHidden
        ),
      [isPasswordConfirmHidden, createPasswordToggle]
    );

    return (
      <Screen
        style={$root}
        preset="auto"
        safeAreaEdges={["top", "bottom"]}
        contentContainerStyle={themed($screenContentContainer)}
      >
        <Text
          testID="register-heading"
          preset="heading"
          tx="signUpScreen:signUp"
          style={themed($signUp)}
        />
        <Text preset="subheading" tx="signUpScreen:enterDetails" />
        <Text
          tx="signUpScreen:ToLogIn"
          style={[themed($signUpText), { marginTop: 12 }]}
        />
        <Text
          text="Login"
          style={[themed($signUpLink), themed($signUpText)]}
          onPress={toLogin}
        />

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
          onSubmitEditing={async () => {
            if (!authEmail || !authPassword) return;
            setIsSubmitted(true);
            navigation.navigate("Demo", { screen: "DemoCommunity" });
          }}
          helper={passwordError}
          status={passwordError ? "error" : undefined}
          RightAccessory={PasswordRightAccessory}
        />
        <TextField
          ref={authPasswordInput}
          value={authPasswordConfirm}
          onChangeText={setAuthPasswordConfirm}
          containerStyle={themed($textField)}
          autoCapitalize="none"
          autoComplete="password"
          autoCorrect={false}
          secureTextEntry={isPasswordConfirmHidden}
          labelTx="loginScreen:passwordFieldLabelConf"
          placeholderTx="loginScreen:passwordFieldPlaceholder"
          onSubmitEditing={async () => {
            if (!authEmail || !authPassword) return;
            setIsSubmitted(true);
            navigation.navigate("Demo", { screen: "DemoCommunity" });
          }}
          helper={passwordConfirmError}
          status={passwordConfirmError ? "error" : undefined}
          RightAccessory={PasswordConfirmRightAccessory}
        />
        <Button
          testID="register-button"
          text="Let's Go"
          style={themed($tapButton)}
          preset="reversed"
          onPress={Register}
        />
      </Screen>
    );
  }
);

const $root: ViewStyle = {
  flex: 1,
};

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
});

const $enterDetails: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
});

const $signUp: ThemedStyle<TextStyle> = ({ spacing }) => ({
  marginBottom: spacing.sm,
});

const $hint: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
  marginBottom: spacing.md,
});

const $signUpText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  textAlign: "center",
});

const $signUpLink: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
  marginBottom: spacing.md,
});

const $textField: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.lg,
});

const $tapButton: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
});
