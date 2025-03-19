import React from "react";
import { View, StyleSheet } from "react-native";
import { P } from "@/components/ui/typography";

import {
	GemstoneColor,
	GemstoneShape,
	GemTreatmentEnum,
	GemTreatmentLabels,
} from "@/app/types/gemstone";
import { Badge } from "react-native-paper";

interface GemstoneHeaderProps {
	name: string;
	shape: GemstoneShape;
	color: GemstoneColor;
	gemType: GemTreatmentEnum;
}

export const GemstoneHeader: React.FC<GemstoneHeaderProps> = ({
	name,
	shape,
	color,
	gemType,
}) => {
	return (
		<View style={styles.container}>
			<P style={styles.name}>{name}</P>
			<View
				style={{
					gap: 4,
					alignItems: "flex-start",
					justifyContent: "flex-start",
				}}
			>
				{gemType && (
					<Badge
						style={[
							styles.badge,
							{
								backgroundColor:
									gemType === GemTreatmentEnum.HEATED ? "#f70000" : "#81C784",
							},
						]}
					>
						{GemTreatmentLabels[gemType]}
					</Badge>
				)}
				{color && (
					<Badge
						style={[
							styles.badge,
							{
								backgroundColor: getBgColor(color),
							},
						]}
					>
						{color}
					</Badge>
				)}
			</View>
			<View style={styles.shapeContainer}>
				<P>{shape}</P>
			</View>
		</View>
	);
};

const getBgColor = (color: GemstoneColor) => {
	switch (color) {
		case GemstoneColor.NEON_PINK:
			return "#f71c69";
		case GemstoneColor.ROYAL_BLUE:
			return "#02066c";
		case GemstoneColor.RED:
			return "#f70000";
		case GemstoneColor.GREEN:
			return "#007c02";
		case GemstoneColor.BLUE:
			return "#2196F3";
		case GemstoneColor.YELLOW:
			return "#FFC107";
		case GemstoneColor.PURPLE:
			return "#9C27B0";
		case GemstoneColor.ORANGE:
			return "#FF9800";
		case GemstoneColor.PINK:
			return "#f68fb0";
		case GemstoneColor.BROWN:
			return "#795548";
		case GemstoneColor.BLACK:
			return "#000000";
		case GemstoneColor.WHITE:
			return "#000000";
		case GemstoneColor.COLORLESS:
			return "#000000";
		case GemstoneColor.MULTI:
			return "#000000";
		case GemstoneColor.NEON_BLUE:
			return "#00FFFF";
		case GemstoneColor.PINKISH_PURPLE:
			return "#d457d4";
		case GemstoneColor.HOT_PINK:
			return "#FF1493";
		case GemstoneColor.CORN_FLOWER:
			return "#3b5aee";
		case GemstoneColor.PINK_ORANGE:
			return "#f68fb0";
		default:
			return "#000000";
	}
};

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingVertical: 16,
		paddingHorizontal: 16,
		backgroundColor: "transparent",
		borderBottomWidth: 1,
		borderBottomColor: "#e0e0e0",
	},
	name: {
		fontSize: 20,
		fontWeight: "bold",
		marginRight: 16,
	},
	shapeContainer: {
		marginRight: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	badge: {
		fontSize: 14,
		width: "100%",
		paddingHorizontal: 12,
		fontWeight: "bold",
	},
});
