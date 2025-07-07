// import React, { ComponentType } from "react";
// import {
//   Pressable,
//   PressableProps,
//   PressableStateCallbackType,
//   StyleProp,
//   TextStyle,
//   ViewStyle,
//   Image,
//   Alert,
// } from "react-native";
// import type { ThemedStyle, ThemedStyleArray } from "@/theme";
// import { $styles } from "../theme";
// import { Text, TextProps } from "./Text";
// import { useAppTheme } from "@/utils/useAppTheme";


// import { useStores } from "@/models";
// import * as WebBrowser from "expo-web-browser";

// WebBrowser.maybeCompleteAuthSession();

// type Presets = "default";

// const googleIcon = require("../../assets/Social/google.png");

// export interface ButtomAccessoryProps {
//   style: StyleProp<any>;
//   pressableState: PressableStateCallbackType;
//   disabled?: boolean;
// }

// export interface ButtomProps extends PressableProps {
//   /**
//    * Text which is looked up via i18n.
//    */
//   tx?: TextProps["tx"];
//   /**
//    * The text to display if not using `tx` or nested components.
//    */
//   text?: TextProps["text"];
//   /**
//    * Optional options to pass to i18n. Useful for interpolation
//    * as well as explicitly setting locale or translation fallbacks.
//    */
//   txOptions?: TextProps["txOptions"];
//   /**
//    * An optional style override useful for padding & margin.
//    */
//   style?: StyleProp<ViewStyle>;
//   /**
//    * An optional style override for the "pressed" state.
//    */
//   pressedStyle?: StyleProp<ViewStyle>;
//   /**
//    * An optional style override for the button text.
//    */
//   textStyle?: StyleProp<TextStyle>;
//   /**
//    * An optional style override for the button text when in the "pressed" state.
//    */
//   pressedTextStyle?: StyleProp<TextStyle>;
//   /**
//    * An optional style override for the button text when in the "disabled" state.
//    */
//   disabledTextStyle?: StyleProp<TextStyle>;
//   /**
//    * One of the different types of button presets.
//    */
//   preset?: Presets;
//   /**
//    * An optional component to render on the right side of the text.
//    * Example: `RightAccessory={(props) => <View {...props} />}`
//    */
//   RightAccessory?: ComponentType<ButtomAccessoryProps>;
//   /**
//    * An optional component to render on the left side of the text.
//    * Example: `LeftAccessory={(props) => <View {...props} />}`
//    */
//   LeftAccessory?: ComponentType<ButtomAccessoryProps>;
//   /**
//    * Children components.
//    */
//   children?: React.ReactNode;
//   /**
//    * disabled prop, accessed directly for declarative styling reasons.
//    * https://reactnative.dev/docs/pressable#disabled
//    */
//   disabled?: boolean;
//   /**
//    * An optional style override for the disabled state
//    */
//   disabledStyle?: StyleProp<ViewStyle>;
// }

// /**
//  * A component that allows users to take actions and make choices.
//  * Wraps the Text component with a Pressable component.
//  * @see [Documentation and Examples]{@link https://docs.infinite.red/ignite-cli/boilerplate/app/components/Button/}
//  * @param {ButtonProps} props - The props for the `Button` component.
//  * @returns {JSX.Element} The rendered `Button` component.
//  * @example
//  * <Button
//  *   tx="common:ok"
//  *   style={styles.button}
//  *   textStyle={styles.buttonText}
//  *   onPress={handleButtonPress}
//  * />
//  */
// export function GoogleButtom(props: ButtomProps): JSX.Element {
//   const { authenticationStore } = useStores();
//   const [userInfo, setUserInfo] = React.useState<{
//     email?: string;
//     username?: string;
//     picture?: string;
//   }>({});
//   authenticationStore.setUserInfo(userInfo);

//   const [request, response, promptAsync] = Google.useAuthRequest({
//     iosClientId: process.env.EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID,
//     androidClientId: process.env.EXPO_PUBLIC_ANDROID_GOOGLE_CLIENT_ID,
//     webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID, // optional if using web
//     scopes: ["profile", "email"],
//   });

//   React.useEffect(() => {
//     const handleGoogleResponse = async () => {
//       if (response?.type === "success") {
//         try {
//           const { idToken, accessToken } = response.authentication || {};

//           if (!idToken) throw new Error("Missing ID token");
//           // ✅ Fetch Google user info to get required ID
//           const profileResponse = await fetch(
//             "https://www.googleapis.com/oauth2/v3/userinfo",
//             {
//               headers: { Authorization: `Bearer ${accessToken}` },
//             }
//           );
//           const profile = await profileResponse.json();
//           const googleUserId = profile.sub;
//           const emails = profile.email;
//           const name = profile.name;
//           const picture = profile.picture;

//           if (!googleUserId)
//             throw new Error("Google ID (sub) not found in user info");

//           const authData = {
//             id: googleUserId,
//             id_token: idToken,
//             access_token: accessToken,
//           };
//           const user = await Parse.User.logInWith("google", { authData });
//           user.set("username", name);
//           user.set("email", emails);
//           user.set("picture", picture);
//           const sessionToken = user.getSessionToken();
//           // const email = user.get("email") || emails;
//           const username = user.get("username") || name;
//           console.log("Google user:", user);
//           console.log("Google user email:", emails);
//           console.log("Google user username:", name);
//           console.log("Google user picture:", picture);
//           console.log("Google user ID:", googleUserId);

//           authenticationStore.setAuthenticated(true);
//           authenticationStore.setAccessToken(sessionToken);
//           authenticationStore.setUser(emails, name, picture);

//           authenticationStore.setLive(true);

//           // ✅ Save user info in local state
//           setUserInfo({
//             email: emails,
//             username: name,
//             picture: picture,
//           });

//           console.log("✅ Google login success:", username);
//         } catch (err:any) {
//           console.error("❌ Google login error:", err);
//           Alert.alert("Login failed", err.message || "Unknown error");
//         }
//       }
//     };

//     handleGoogleResponse();
//   }, [response]);

//   const {
//     style: $viewStyleOverride,
//     pressedStyle: $pressedViewStyleOverride,
//     textStyle: $textStyleOverride,
//     pressedTextStyle: $pressedTextStyleOverride,
//     disabledTextStyle: $disabledTextStyleOverride,
//     RightAccessory,
//     LeftAccessory,
//     disabled,
//     disabledStyle: $disabledViewStyleOverride,
//     ...rest
//   } = props;

//   const { themed } = useAppTheme();

//   const preset: Presets = props.preset ?? "default";
//   /**
//    * @param {PressableStateCallbackType} root0 - The root object containing the pressed state.
//    * @param {boolean} root0.pressed - The pressed state.
//    * @returns {StyleProp<ViewStyle>} The view style based on the pressed state.
//    */
//   function $viewStyle({
//     pressed,
//   }: PressableStateCallbackType): StyleProp<ViewStyle> {
//     return [
//       themed($viewPresets[preset]),
//       $viewStyleOverride,
//       !!pressed &&
//         themed([$pressedViewPresets[preset], $pressedViewStyleOverride]),
//       !!disabled && $disabledViewStyleOverride,
//     ];
//   }
//   /**
//    * @param {PressableStateCallbackType} root0 - The root object containing the pressed state.
//    * @param {boolean} root0.pressed - The pressed state.
//    * @returns {StyleProp<TextStyle>} The text style based on the pressed state.
//    */

//   return (
//     <Pressable
//       style={$viewStyle}
//       accessibilityRole="button"
//       accessibilityState={{ disabled: !!disabled }}
//       {...rest}
//       disabled={[disabled, !request].some(Boolean)}
//       onPress={() => promptAsync()}
//     >
//       {(state: PressableStateCallbackType) => (
//         <>
//           {!!LeftAccessory && (
//             <LeftAccessory
//               style={$leftAccessoryStyle}
//               pressableState={state}
//               // Make sure React is imported at the top of the file:
//               // import React from "react";
//               disabled={disabled}
//             />
//           )}

//           <Image source={googleIcon} />

//           {!!RightAccessory && (
//             <RightAccessory
//               style={$rightAccessoryStyle}
//               pressableState={state}
//               disabled={disabled}
//             />
//           )}
//         </>
//       )}
//     </Pressable>
//   );
// }

// const $baseViewStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
//   minHeight: 44,
//   width: 236,
//   borderRadius: 12,
//   justifyContent: "center",
//   alignItems: "center",
//   paddingVertical: spacing.sm,
//   paddingHorizontal: spacing.sm,
//   overflow: "hidden",
// });

// const $rightAccessoryStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
//   marginStart: spacing.xs,
//   zIndex: 1,
// });
// const $leftAccessoryStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
//   marginEnd: spacing.xs,
//   zIndex: 1,
// });

// const $viewPresets: Record<Presets, ThemedStyleArray<ViewStyle>> = {
//   default: [
//     $styles.row,
//     $baseViewStyle,
//     ({ colors }) => ({
//       borderColor: colors.palette.neutral200,
//       backgroundColor: colors.palette.neutral200,
//     }),
//   ],
// };

// const $pressedViewPresets: Record<Presets, ThemedStyle<ViewStyle>> = {
//   default: ({ colors }) => ({
//     backgroundColor: colors.palette.neutral200,
//     opacity: 0.8,
//   }),
// };
