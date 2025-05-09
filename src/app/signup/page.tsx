"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const { isLoading, signUpWithEmail, getSavedEmail } = useAuth();

  // Check for saved email on component mount
  useEffect(() => {
    const savedEmail = getSavedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, [getSavedEmail]);

  const validatePasswords = () => {
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }
    if (password.length < 6) {
      setPasswordError("Password should be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const validateEmail = () => {
    if (!email.endsWith("@gmail.com")) {
      toast.error("Only Gmail addresses are allowed");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswords()) {
      return;
    }
    
    if (!validateEmail()) {
      return;
    }
    
    await signUpWithEmail(email, password, rememberEmail);
  };

  const isFormValid = email.trim() !== "" && 
                     password.trim() !== "" && 
                     confirmPassword.trim() !== "";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md p-8 bg-white shadow-md rounded-lg">
        <div className="flex flex-col items-center space-y-6">
          <div className="mb-2">
            <Image
              src="/mailmeteor-logo.svg"
              alt="AI-Email-Gen Logo"
              width={60}
              height={60}
              className="mx-auto"
            />
          </div>
          
          <div className="text-center mb-2">
            <h1 className="text-3xl font-bold text-gray-800">Welcome aboard</h1>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">AI-Email-Gen</h2>
            <p className="text-gray-600">
              Create an account to send personalized emails,
              follow-ups and more with AI-Email-Gen. It&apos;s free.
            </p>
          </div>

          <form className="w-full space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="Enter your email"
                className="w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-red-500 mt-1">
                Only Gmail addresses are allowed (e.g., @gmail.com)
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Enter your password"
                className="w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder="Confirm your password"
                className={`w-full ${passwordError ? "border-red-500" : ""}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {passwordError && (
                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="remember" 
                checked={rememberEmail}
                onCheckedChange={(checked) => setRememberEmail(checked === true)}
              />
              <Label htmlFor="remember" className="text-sm text-gray-600">
                Remember my email on this device
              </Label>
            </div>

            <Button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="text-center text-gray-600 text-sm">
            Already have an account? <Link href="/login" className="text-blue-500 hover:underline">Log in</Link>
          </div>
        </div>
      </Card>

      <div className="mt-8 text-sm text-gray-500">
        By signing up, you agree to our <Link href="#" className="text-gray-500 hover:underline">Terms</Link> and <Link href="#" className="text-gray-500 hover:underline">Privacy policy</Link>.
      </div>
    </div>
  );
} 