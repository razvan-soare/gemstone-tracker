import React from "react";
import { Dialog, Portal, Button } from "react-native-paper";
import { useLanguage } from "@/hooks/useLanguage";
import { P } from "./ui/typography";

type DeleteConfirmationDialogProps = {
	visible: boolean;
	onDismiss: () => void;
	onConfirm: () => void;
	count: number;
};

const DeleteConfirmationDialog = ({
	visible,
	onDismiss,
	onConfirm,
	count,
}: DeleteConfirmationDialogProps) => {
	const { t } = useLanguage();

	return (
		<Portal>
			<Dialog visible={visible} onDismiss={onDismiss}>
				<Dialog.Title>Delete Confirmation</Dialog.Title>
				<Dialog.Content>
					<P>
						Are you sure you want to delete {count} selected gemstone
						{count !== 1 ? "s" : ""}? This action cannot be undone.
					</P>
				</Dialog.Content>
				<Dialog.Actions>
					<Button onPress={onDismiss}>Cancel</Button>
					<Button onPress={onConfirm} textColor="red">
						Delete
					</Button>
				</Dialog.Actions>
			</Dialog>
		</Portal>
	);
};

export default DeleteConfirmationDialog;
