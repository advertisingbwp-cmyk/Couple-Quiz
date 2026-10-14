type SetupStorage = Pick<Storage, "setItem">;

/** Preserve the session contract consumed by the existing /quiz/create page. */
export function saveCreatorSetup(
  name: string,
  gender: "male" | "female",
  storage: SetupStorage,
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Add your name or a nickname to get started.";
  if (trimmed.length > 30)
    return "Keep your name or nickname to 30 characters.";
  try {
    storage.setItem("creator_name", trimmed);
    storage.setItem("creator_gender", gender);
    return null;
  } catch {
    return "Your browser couldn't save your quiz setup. Allow site storage, then try again.";
  }
}
