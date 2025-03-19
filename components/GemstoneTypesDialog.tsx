import React from "react";
import { Tables } from "@/lib/database.types";
import { useOrganizationGemstoneTypes } from "@/hooks/useOrganizationGemstoneTypes";
import { ManagementDialog } from "./ManagementDialog";

type GemstoneTypesDialogProps = {
	visible: boolean;
	onDismiss: () => void;
};

export const GemstoneTypesDialog = ({
	visible,
	onDismiss,
}: GemstoneTypesDialogProps) => {
	const {
		gemstoneTypes,
		isLoading,
		stoneCounts,
		addGemstoneType,
		deleteGemstoneType,
	} = useOrganizationGemstoneTypes();

	const handleAddGemstoneType = async (name: string) => {
		await addGemstoneType.mutateAsync(name);
	};

	const handleDeleteGemstoneType = (
		gemstoneType: Tables<"organization_gemstone_types">,
	) => {
		deleteGemstoneType.mutateAsync(gemstoneType.id);
	};

	return (
		<ManagementDialog
			visible={visible}
			onDismiss={onDismiss}
			title="Manage Gemstone Types"
			description="Add or remove gemstone types for your organization. These will be available in all gemstone forms and filters."
			inputLabel="New Gemstone Type"
			items={gemstoneTypes}
			isLoading={isLoading}
			itemCounts={stoneCounts}
			onAddItem={handleAddGemstoneType}
			onDeleteItem={handleDeleteGemstoneType}
			getItemName={(item) => item.name}
			getItemId={(item) => item.id}
		/>
	);
};
