import React from "react";
import { Tables } from "@/lib/database.types";
import { useOrganizationShapes } from "@/hooks/useOrganizationShapes";
import { ManagementDialog } from "./ManagementDialog";

type ShapesDialogProps = {
	visible: boolean;
	onDismiss: () => void;
};

export const ShapesDialog = ({ visible, onDismiss }: ShapesDialogProps) => {
	const { shapes, isLoading, stoneCounts, addShape, deleteShape } =
		useOrganizationShapes();

	const handleAddShape = async (name: string) => {
		await addShape.mutateAsync(name);
	};

	const handleDeleteShape = (shape: Tables<"organization_shapes">) => {
		deleteShape.mutateAsync(shape.id);
	};

	return (
		<ManagementDialog
			visible={visible}
			onDismiss={onDismiss}
			title="Manage Shapes"
			description="Add or remove gemstone shapes for your organization. These will be available in all gemstone forms and filters."
			inputLabel="New Shape"
			items={shapes}
			isLoading={isLoading}
			itemCounts={stoneCounts}
			onAddItem={handleAddShape}
			onDeleteItem={handleDeleteShape}
			getItemName={(item) => item.name}
			getItemId={(item) => item.id}
		/>
	);
};
