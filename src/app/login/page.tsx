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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(false);
  const { isLoading, signInWithEmail, getSavedEmail } = useAuth();

  // Check for saved email on component mount
  useEffect(() => {
    const savedEmail = getSavedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, [getSavedEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signInWithEmail(email, password, rememberEmail);
  };

  const isFormValid = email.trim() !== "" && password.trim() !== "";

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
            <p className="text-gray-600 mb-4">
              Welcome back! Log in to your account to access your AI-powered email generator. It&apos;s fast, free, and secure.
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
              {isLoading ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <div className="text-center text-blue-500 text-xl text-sm">
            <Link href="/signup">Don&apos;t have an account? Sign up</Link>
          </div>
        </div>
      </Card>

      <div className="mt-8 text-sm text-gray-500">
        © 2025 AI-Email-Gen <span className="px-2">-</span> 
        <Link href="#" className="text-gray-500 hover:text-gray-700">Terms</Link> 
        <span className="px-2">-</span> 
        <Link href="#" className="text-gray-500 hover:text-gray-700">Security</Link> 
        <span className="px-2">-</span> 
        <Link href="#" className="text-gray-500 hover:text-gray-700">Help</Link>
      </div>
    </div>
  );
} 