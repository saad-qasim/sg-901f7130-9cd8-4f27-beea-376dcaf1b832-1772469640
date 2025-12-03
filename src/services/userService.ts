  async deleteUser(id: string): Promise < void> {
    // Call server-side API route ...
    const response = await fetch("/api/admin/delete-user", {
        ...
    });

    const result = await response.json();

    if(!response.ok || !result.success) {
    throw new Error(result.error || "Failed to delete user");
}
  },
};