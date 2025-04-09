import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { FAB } from "react-native-paper";
import { useLanguage } from "@/hooks/useLanguage";

type FloatingActionButtonProps = {
	selectedCount: number;
	onExport: () => void;
	onDelete: () => void;
	onAdd: () => void;
};

const FloatingActionButton = ({
	selectedCount,
	onExport,
	onDelete,
	onAdd,
}: FloatingActionButtonProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const { t } = useLanguage();

	const onStateChange = ({ open }: { open: boolean }) => setIsOpen(open);

	const actions = [];

	// Always show export action
	actions.push({
		icon: "file-export",
		label: t("buyList.export"),
		onPress: onExport,
	});
	actions.push({
		icon: "plus",
		label: t("common.add"),
		onPress: onAdd,
	});

	// Show delete action only when items are selected
	if (selectedCount > 0) {
		actions.push({
			icon: "delete",
			label: `Delete ${selectedCount} selected`,
			onPress: onDelete,
		});
	}

	return (
		<FAB.Group
			open={isOpen}
			visible
			icon={selectedCount > 0 ? "numeric-" + selectedCount : "plus"}
			actions={actions}
			onStateChange={onStateChange}
			onPress={() => {
				if (selectedCount === 0) {
					setIsOpen(!isOpen);
				}
			}}
			style={styles.fab}
			fabStyle={{
				borderRadius: 100,
			}}
		/>
	);
};

const styles = StyleSheet.create({
	fab: {
		position: "absolute",
		margin: 16,
		right: 0,
		bottom: -40,
		borderRadius: 100,
	},
});

export default FloatingActionButton;
