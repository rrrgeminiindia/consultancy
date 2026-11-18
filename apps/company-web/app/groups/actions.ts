"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { addGroupMember, ApiError, createGroup } from "../lib/api";

export interface GroupActionState {
  message: string;
  success: boolean;
}

export const initialGroupActionState: GroupActionState = { message: "", success: false };

export async function createGroupAction(
  _previousState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const description = String(formData.get("description") ?? "").trim();

  if (name.length < 2) return { message: "Enter a group name.", success: false };
  if (!/^[A-Z][A-Z0-9_-]{1,31}$/.test(code)) {
    return {
      message: "Code must start with a letter and use only uppercase letters, numbers, _ or -.",
      success: false,
    };
  }

  let group;
  try {
    group = await createGroup({ name, code, description: description || undefined });
  } catch (error) {
    return {
      message: error instanceof ApiError ? error.message : "Unable to create the group.",
      success: false,
    };
  }

  revalidatePath("/groups");
  redirect(`/groups/${group.id}`);
}

export async function addGroupMemberAction(
  groupId: string,
  _previousState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const userId = String(formData.get("user_id") ?? "");
  const membershipRole = String(formData.get("membership_role") ?? "");
  const allowedRoles = new Set(["LEAD", "RECRUITER", "MARKETING", "VIEWER"]);

  if (!userId) return { message: "Select a user.", success: false };
  if (!allowedRoles.has(membershipRole)) {
    return { message: "Select a valid group role.", success: false };
  }

  try {
    await addGroupMember(groupId, {
      user_id: userId,
      membership_role: membershipRole,
    });
  } catch (error) {
    return {
      message: error instanceof ApiError ? error.message : "Unable to add the group member.",
      success: false,
    };
  }

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");
  return { message: "User added to the group.", success: true };
}
