import React from "react";
import { Tables } from "@/lib/database.types";
import { useOrganizationColors } from "@/hooks/useOrganizationColors";
import { ManagementDialog } from "./ManagementDialog";

type ColorsDialogProps = {
	visible: boolean;
	onDismiss: () => void;
};

export const ColorsDialog = ({ visible, onDismiss }: ColorsDialogProps) => {
	const {
		colors: orgColors,
		isLoading,
		stoneCounts,
		addColor,
		deleteColor,
	} = useOrganizationColors();

	const handleAddColor = async (name: string) => {
		await addColor.mutateAsync(name);
	};

	const handleDeleteColor = (color: Tables<"organization_colors">) => {
		deleteColor.mutateAsync(color.id);
	};

	return (
		<ManagementDialog
			visible={visible}
			onDismiss={onDismiss}
			title="Manage Colors"
			description="Add or remove gemstone colors for your organization. These will be available in all gemstone forms and filters."
			inputLabel="New Color"
			items={orgColors}
			isLoading={isLoading}
			itemCounts={stoneCounts}
			onAddItem={handleAddColor}
			onDeleteItem={handleDeleteColor}
			getItemName={(item) => item.name}
			getItemId={(item) => item.id}
		/>
	);
};
