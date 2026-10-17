type SetupStorage = Pick<Storage, "setItem"> & Partial<Pick<Storage, "removeItem">>;

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
    try {
      storage.removeItem?.("creator_name");
      storage.removeItem?.("creator_gender");
    } catch {
      // ignore rollback errors
    }
    return "Your browser couldn't save your quiz setup. Allow site storage, then try again.";
  }
}

