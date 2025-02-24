import { useColorScheme } from "@/lib/useColorScheme";
import { useState } from "react";
import { View } from "react-native";
import { IconButton, Menu } from "react-native-paper";
import { ViewSettings } from "./GemstoneList";

type ViewSettingsButtonProps = {
	setViewSettings: (settings: ViewSettings) => void;
};

const ViewSettingsButton = ({ setViewSettings }: ViewSettingsButtonProps) => {
	const [visible, setVisible] = useState(false);
	const { toggleColorScheme, colorScheme } = useColorScheme();
	const openMenu = () => setVisible(true);
	const closeMenu = () => setVisible(false);

	const handleSelect = (columns: ViewSettings["columnsCount"]) => {
		setViewSettings({ columnsCount: columns });
		closeMenu();
	};

	return (
		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
			}}
		>
			<Menu
				visible={visible}
				onDismiss={closeMenu}
				anchor={<IconButton icon="cog" size={24} onPress={openMenu} />}
			>
				<Menu.Item
					onPress={() => toggleColorScheme()}
					title={colorScheme === "dark" ? "Light Mode" : "Dark Mode"}
				/>
				<Menu.Item onPress={() => handleSelect(1)} title="Single Column" />
				<Menu.Item onPress={() => handleSelect(2)} title="Two Columns" />
				<Menu.Item onPress={() => handleSelect(3)} title="Three Columns" />
			</Menu>
		</View>
	);
};

export default ViewSettingsButton;
