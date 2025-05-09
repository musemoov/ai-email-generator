"use client";

import { supabase } from "./supabaseClient";
import { EmailHistory } from "@/types";

export async function saveEmailToVault(userId: string, prompt: string, email: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("email_history")
      .insert({
        user_id: userId,
        prompt,
        email
      });

    if (error) {
      console.error("Error saving email to vault:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error saving email to vault:", error);
    return false;
  }
}

export async function fetchEmailHistory(userId: string): Promise<EmailHistory[]> {
  try {
    const { data, error } = await supabase
      .from("email_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching email history:", error?.message || error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching email history:", error instanceof Error ? error.message : error);
    return [];
  }
}

export async function deleteEmailFromVault(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("email_history")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting email from vault:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting email from vault:", error);
    return false;
  }
} 