import { SignUp } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <SignUp />
    </div>
  );
}
