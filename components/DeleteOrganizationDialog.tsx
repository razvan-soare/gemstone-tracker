import { supabase } from "@/config/supabase";
import { colors } from "@/constants/colors";
import { useColorScheme } from "@/lib/useColorScheme";
import { useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { View } from "react-native";
import { Modal, Portal } from "react-native-paper";
import { Button } from "./ui/button";
import { Text } from "./ui/text";
import { H3, Muted } from "./ui/typography";

type DeleteOrganizationDialogProps = {
	visible: boolean;
	onDismiss: () => void;
	organizationId: string;
};

export const DeleteOrganizationDialog = ({
	visible,
	onDismiss,
	organizationId,
}: DeleteOrganizationDialogProps) => {
	const { colorScheme } = useColorScheme();
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const queryClient = useQueryClient();

	// Get organization name
	const [organizationName, setOrganizationName] = React.useState<string>("");

	React.useEffect(() => {
		const fetchOrganizationName = async () => {
			const { data, error } = await supabase
				.from("organizations")
				.select("name")
				.eq("id", organizationId)
				.single();

			if (!error && data) {
				setOrganizationName(data.name);
			}
		};

		if (visible && organizationId) {
			fetchOrganizationName();
		}
	}, [visible, organizationId]);

	const handleDelete = async () => {
		try {
			setIsDeleting(true);
			setError(null);

			const { error } = await supabase
				.from("organizations")
				.delete()
				.eq("id", organizationId);

			if (error) throw error;

			// Invalidate relevant queries
			queryClient.invalidateQueries({ queryKey: ["organization_members"] });
			queryClient.invalidateQueries({ queryKey: ["organizations"] });
			onDismiss();
		} catch (error: any) {
			console.error("Error deleting organization:", error);
			setError(error.message || "Failed to delete organization");
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Portal>
			<Modal
				visible={visible}
				onDismiss={onDismiss}
				contentContainerStyle={[
					{
						backgroundColor:
							colorScheme === "dark" ? colors.dark.card : colors.light.card,
						padding: 24,
						margin: 16,
						borderRadius: 8,
					},
				]}
			>
				<View className="space-y-4">
					<H3>Delete "{organizationName}"</H3>
					<Muted>
						Are you sure you want to delete this organization? This action
						cannot be undone and all associated data will be permanently lost,
						including:
					</Muted>
					<View className="pl-4">
						<Muted>• All gemstones and their data</Muted>
						<Muted>• All organization members</Muted>
						<Muted>• All custom shapes, colors, and types</Muted>
						<Muted>• All owners and their associations</Muted>
					</View>

					{error && <Text className="text-red-500 text-sm">{error}</Text>}

					<View className="flex-row justify-end items-center space-x-3 mt-6 gap-2">
						<Button variant="outline" onPress={onDismiss} className="flex-1">
							<Text>Cancel</Text>
						</Button>
						<Button
							variant="destructive"
							onPress={handleDelete}
							disabled={isDeleting}
							className="flex-1"
						>
							<Text className="text-white">
								{isDeleting ? "Deleting..." : "Delete"}
							</Text>
						</Button>
					</View>
				</View>
			</Modal>
		</Portal>
	);
};
