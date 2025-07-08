import { FC } from "react";
import { observer } from "mobx-react-lite";
import { ViewStyle, View, Image } from "react-native";
import { AppStackScreenProps } from "@/navigators/types";
import { AutoImage, Button, Icon, Screen, Text } from "@/components";
import { useNavigation } from "@react-navigation/native";
import { useStores } from "@/models";
import { useHeader } from "@/utils/useHeader";
import { ThemedStyle } from "@/theme";
import { useAppTheme } from "@/utils/useAppTheme";

interface ChooseAuthScreenProps extends AppStackScreenProps<"ChooseAuth"> {}

const logo = require("../../assets/images/app-icon-android-adaptive-foreground.png");

export const ChooseAuthScreen: FC<AppStackScreenProps<"ChooseAuth">> = observer(
  function ChooseAuthScreen(_props) {
    // Pull in one of our MST stores
    const { authenticationStore } = useStores();
    const navigation = useNavigation();


    const googleSignIn = () => {

    }

    useHeader(
      {
        leftIcon: "back",
        title: "Welcome to Dooit",
        onLeftPress: () => navigation.goBack(),
      },
      [navigation]
    );

    const {
      themed,
      theme: { colors },
    } = useAppTheme();

    // Pull in navigation via hook
    // const navigation = useNavigation()
    return (
      <Screen
        style={$root}
        contentContainerStyle={themed($screenContentContainer)}
        safeAreaEdges={["bottom"]}
        preset="scroll"
      >
        <Image
          source={logo}
          resizeMode="contain"
          style={{ height: 200, width: 200, alignSelf: "center" }}
        />
        <View style={themed($buttonContainer)}>
          <Button
            // style={}
            text="Continue with Email"
            onPress={() => navigation.navigate("Login")}
            preset="reversed"
          />
          <Button
            // style={}
            text="Sign in with Google"
            style={{gap: 8}}
            onPress={() => navigation.navigate("Login")}
            preset="reversed"
            LeftAccessory={(props) => <Icon icon="google" {...props} size={20} color="white" />}
            
          />
        </View>
      </Screen>
    );
  }
);

const $root: ViewStyle = {
  flex: 1,
};

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  // paddingVertical: spacing.xxl,
  paddingHorizontal: spacing.lg,
});

const $buttonContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.xs,
  flex: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-around",
  gap: spacing.md
});
