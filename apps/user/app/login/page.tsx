import { LoginScreen } from "@repo/ui/components/Auth/LoginScreen";

export default function LoginPage() {
  return <LoginScreen appRoleName="Patient" allowGoogle={true} />;
}
