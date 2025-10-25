import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Welcome: undefined;
  ChooseAuth: undefined;
  Login: undefined;
  SignUp: undefined;
  Demo: undefined;
  // Add other screens here as needed
};

export type AppStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;
