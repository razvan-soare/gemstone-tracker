import { supabase } from "@/config/supabase";
import { useSupabase } from "@/context/supabase-provider";
import { Tables } from "@/lib/database.types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Hook to fetch pending invitations for an organization
export const useOrganizationInvitations = (organizationId: string | null) => {
	return useQuery({
		queryKey: ["organization_invitations", organizationId],
		queryFn: async () => {
			if (!organizationId) return [];

			const { data, error } = await supabase
				.from("invitations")
				.select("*")
				.eq("organization_id", organizationId)
				.is("accepted", null);

			if (error) throw error;
			return data;
		},
		enabled: !!organizationId,
	});
};

// Hook to create an invitation
export const useCreateInvitation = () => {
	const queryClient = useQueryClient();
	const { activeOrganization, user } = useSupabase();

	return useMutation({
		mutationFn: async ({ email }: { email: string }) => {
			const { data, error } = await supabase
				.from("invitations")
				.insert({
					organization_id: activeOrganization?.id,
					email: email.toLowerCase().trim(),
					invited_by: user?.id,
					organization_name: activeOrganization?.name,
				})
				.select()
				.single();

			if (error) throw error;
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["organization_invitations", activeOrganization?.id],
			});
		},
	});
};

// Hook to delete an invitation
export const useDeleteInvitation = () => {
	const queryClient = useQueryClient();
	const { activeOrganization } = useSupabase();
	return useMutation({
		mutationFn: async ({ invitationId }: { invitationId: number }) => {
			const { error } = await supabase
				.from("invitations")
				.delete()
				.eq("id", invitationId);

			if (error) throw error;
			return { success: true };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["organization_invitations", activeOrganization?.id],
			});
		},
	});
};

export const useCheckPendingInvitations = (userEmail: string) => {
	return useQuery({
		queryKey: ["pending_invitations", userEmail],
		queryFn: async () => {
			if (!userEmail) return [];
			const { data, error } = await supabase
				.from("invitations")
				.select("*")
				.eq("email", userEmail.toLowerCase())
				.is("accepted", null);

			if (error) throw error;
			return data;
		},
		enabled: !!userEmail,
	});
};
// Hook to accept an invitation
export const useAcceptInvitation = () => {
	const queryClient = useQueryClient();
	const { user } = useSupabase();
	return useMutation({
		mutationFn: async ({
			invitation,
		}: {
			invitation: Tables<"invitations">;
		}) => {
			const { error } = await supabase
				.from("invitations")
				.update({ accepted: true })
				.eq("id", invitation.id);

			if (error) throw error;

			const { data, error: organizationMembersError } = await supabase
				.from("organization_members")
				.insert({
					organization_id: invitation.organization_id,
					user_id: user?.id,
					role: "collaborator",
				})
				.select()
				.single();

			if (organizationMembersError) throw organizationMembersError;

			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["pending_invitations", user?.email],
			});
			queryClient.invalidateQueries({
				queryKey: ["organization_members"],
			});
		},
	});
};
// Hook to decline an invitation
export const useDeclineInvitation = () => {
	const queryClient = useQueryClient();
	const { user } = useSupabase();
	return useMutation({
		mutationFn: async ({ invitationId }: { invitationId: number }) => {
			const { error } = await supabase
				.from("invitations")
				.update({ accepted: false })
				.eq("id", invitationId);

			if (error) throw error;
			return { success: true };
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["pending_invitations", user?.email],
			});
		},
	});
};
