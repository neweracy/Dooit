import { FC, useRef, useState, useEffect, ComponentType, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { TextInput, TextStyle, ViewStyle } from "react-native";
import { AppStackScreenProps } from "@/navigators";
import {
  Button,
  PressableIcon,
  Screen,
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

export const SignUpScreen: FC<SignUpScreenProps> = observer(
  function SignUpScreen() {
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
    // Pull in navigation via hook
    const navigation = useNavigation<
      NativeStackNavigationProp<AppStackParamList>
    >();
    useHeader(
      {
        leftIcon: "back",
        onLeftPress: () => navigation.navigate("ChooseAuth"),
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

    const login = () => {
      navigation.goBack();
    };

    function signUp() {
      setIsSubmitted(true);
      setAttemptsCount(attemptsCount + 1);

      if (validationError) return;

      // Make a request to your server to get an authentication token.
      // If successful, reset the fields and set the token.
      setIsSubmitted(false);
      setAuthPassword("");
      setAuthEmail("");

      // We'll mock this with a fake token.
      setAuthToken(String(Date.now()));
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
          onPress={login}
        />
        {attemptsCount > 2 && (
                <Text
                  tx="loginScreen:hint"
                  size="sm"
                  weight="light"
                  style={themed($hint)}
                />
              )}
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
})

const $signUpText: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  textAlign: "center",
});

const $signUpLink: ThemedStyle<TextStyle> = ({ colors, spacing }) => ({
  color: colors.tint,
  marginBottom: spacing.md,
});
