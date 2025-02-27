import { supabase } from "@/config/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSupabase } from "@/context/supabase-provider";

export type OrganizationMember = {
	id: string;
	role: string;
	user_id: string | null;
	email: string;
	created_at: string | null;
};

export const useOrganizationMembers = (organizationId: string | null) => {
	const { user, session } = useSupabase();
	const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

	return useQuery({
		queryKey: ["organization_members", organizationId],
		queryFn: async () => {
			if (!organizationId || !session?.access_token) return [];

			// Get organization members
			const { data: members, error } = await supabase
				.from("organization_members")
				.select("id, role, user_id, created_at")
				.eq("organization_id", organizationId);

			if (error) throw error;

			// For the current user, we already have their email
			const membersWithEmail = members.map((member) => {
				let email = ""; // Default empty email

				// If this member is the current user, use their email
				if (user && member.user_id === user.id) {
					email = user.email || "unknown@example.com";
				}

				return {
					...member,
					email,
				};
			});

			// For other members, we need to fetch their emails
			// We'll use our edge function to get user emails
			if (supabaseUrl && members.length > 0) {
				try {
					// Get user IDs that are not the current user
					const userIds = members
						.filter((member) => member.user_id && member.user_id !== user?.id)
						.map((member) => member.user_id);

					if (userIds.length > 0) {
						// Call the edge function to get user emails
						const response = await fetch(
							`${supabaseUrl}/functions/v1/get-user-emails`,
							{
								method: "POST",
								headers: {
									"Content-Type": "application/json",
									Authorization: `Bearer ${session.access_token}`,
								},
								body: JSON.stringify({ userIds }),
							},
						);

						if (response.ok) {
							const { users } = await response.json();

							// Update member emails
							for (const member of membersWithEmail) {
								if (member.user_id && member.user_id !== user?.id) {
									const foundUser = users.find(
										(u: any) => u.id === member.user_id,
									);
									if (foundUser) {
										member.email = foundUser.email;
									}
								}
							}
						}
					}
				} catch (error) {
					console.error("Failed to fetch user emails:", error);
					// Fall back to using placeholder emails
					membersWithEmail.forEach((member) => {
						if (!member.email) {
							member.email = "user@example.com";
						}
					});
				}
			}

			return membersWithEmail as OrganizationMember[];
		},
		enabled: !!organizationId && !!session?.access_token,
	});
};

export const useIsOrganizationOwner = (organizationId: string | null) => {
	const { user } = useSupabase();

	return useQuery({
		queryKey: ["organization_owner", organizationId, user?.id],
		queryFn: async () => {
			if (!organizationId || !user) return false;

			const { data, error } = await supabase
				.from("organization_members")
				.select("role")
				.eq("organization_id", organizationId)
				.eq("user_id", user.id)
				.single();

			if (error) return false;

			return data.role === "owner";
		},
		enabled: !!organizationId && !!user,
	});
};

export const useRemoveOrganizationMember = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			memberId,
			organizationId,
		}: {
			memberId: string;
			organizationId: string;
		}) => {
			const { error } = await supabase
				.from("organization_members")
				.delete()
				.eq("id", memberId);

			if (error) throw error;
			return { success: true };
		},
		onSuccess: (_, { organizationId }) => {
			queryClient.invalidateQueries({
				queryKey: ["organization_members", organizationId],
			});
		},
	});
};
