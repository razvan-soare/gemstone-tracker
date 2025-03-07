import { useCallback, useMemo, useState } from "react";

export interface IDialogHolder<T = any> {
	key: string;
	open: boolean;
	onOpen: (dialogContent?: T) => void;
	onClose: () => void;
	onUpdate: (dialogContent: Partial<T>) => void;
	dialogContent: T | undefined;
}

// side note: an easier solution than this would be to use "open"
// as the key to the dialog, but that doesn't work unfortunately
// the reason is that the dialog will unmount immediately after
// setting open to "false", but the dialog closing animation will
// still take a while until finishes, and the screen will flash
// from the full state of the dialog to its empty state (because
// you've just remounted the dialog)
// IMPORTANT: make sure to pass the dialogKey to the highest
// most parent, and never use <WardenDialog> or <Dialog> directly
// always wrap the state in another component. In case that is not clear,
// you have to set "dialogKey" on the component that renders the <Dialog>
// it's best if u look at some examples to understand
export function useDialog<T>(params?: {
	initialData?: T;
	defaultOpen?: boolean;
}): IDialogHolder<T> {
	const [dialogKey, setDialogKey] = useState(Math.floor(Math.random() * 1e9));
	const [open, setOpen] = useState(!!params?.defaultOpen);
	const [dialogContent, setDialogContent] = useState<T | undefined>(
		params?.initialData,
	);
	const openCb = useCallback((dialogContent?: T) => {
		setDialogKey((prev) => prev + 1);
		setOpen(true);
		setDialogContent(dialogContent);
	}, []);
	const closeCb = useCallback(() => {
		setOpen(false);
		setDialogContent(undefined);
	}, []);

	const updateCb = useCallback((dialogContent: Partial<T>) => {
		if (!dialogContent) return;
		setDialogContent((prevProps: T | undefined): T => {
			return {
				...(prevProps ? prevProps : ({} as T)),
				...dialogContent,
			};
		});
	}, []);
	const dialogData = useMemo(
		() => ({
			key: `key_${dialogKey}`,
			open,
			onOpen: openCb,
			onClose: closeCb,
			onUpdate: updateCb,
			dialogContent,
		}),
		[closeCb, dialogContent, dialogKey, open, openCb, updateCb],
	);
	return dialogData;
}
