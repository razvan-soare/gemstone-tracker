import { Tables } from "@/lib/database.types";
import { getDefaultStoneImage } from "@/lib/imageUtils";
import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { Card, Title } from "react-native-paper";
import { OptimizedImage } from "./OptimizedImage";
import { Badge } from "./ui/badge";
import { Muted, P } from "./ui/typography";
import { Currency, CurrencySymbols } from "@/app/types/gemstone";

// Helper function to safely get currency symbol
const getCurrencySymbol = (currencyCode: string | null): string => {
	if (!currencyCode) return "$";

	// Check if the currency code is a valid Currency enum value
	const isValidCurrency = Object.values(Currency).includes(currencyCode as any);
	if (isValidCurrency) {
		return CurrencySymbols[currencyCode as Currency];
	}

	return "$"; // Default fallback
};

const GemstoneCard = ({
	gemstone,
}: {
	gemstone: Tables<"stones"> & { images: Tables<"images">[] };
}) => {
	const isSold = !!gemstone.sold_at;

	return (
		<Pressable onPress={() => router.push(`/(app)/gemstone/${gemstone.id}`)}>
			<Card style={[styles.card, isSold && styles.soldCard]}>
				<View style={styles.imageContainer}>
					<OptimizedImage
						image={gemstone.images?.[0] || ""}
						placeholder={getDefaultStoneImage()}
						style={styles.image}
					/>
					{isSold && (
						<View style={styles.soldBadge}>
							<P style={styles.soldBadgeText}>SOLD</P>
						</View>
					)}
				</View>

				<Card.Content>
					<View className="flex flex-row items-center gap-4 mb-4">
						<P className="text-base font-bold">{gemstone.name}</P>
						<Muted className="font-bold">{gemstone.bill_number}</Muted>
					</View>
					<View style={styles.chipsWrapper}>
						<Badge variant="outline" style={styles.chipBox}>
							<P style={styles.chip}>{gemstone.shape}</P>
						</Badge>
						<Badge variant="outline" style={styles.chipBox}>
							<P style={styles.chip}>{gemstone.weight} ct</P>
						</Badge>
						<Badge variant="outline" style={styles.chipBox}>
							<P style={styles.chip}>{gemstone.color}</P>
						</Badge>
						<Badge variant="outline" style={styles.chipBox}>
							<P style={styles.chip}>{gemstone.cut}</P>
						</Badge>
					</View>
					{(gemstone.buy_price || gemstone.sell_price) && (
						<View style={styles.priceContainer}>
							{gemstone.buy_price && (
								<P className="text-green-500 font-semibold">
									Buy: {getCurrencySymbol(gemstone.buy_currency)}
									{gemstone.buy_price.toFixed(2)}
								</P>
							)}
							{gemstone.sell_price && (
								<P className="text-red-500 font-semibold">
									Sell: {getCurrencySymbol(gemstone.sell_currency)}
									{gemstone.sell_price.toFixed(2)}
								</P>
							)}
						</View>
					)}
				</Card.Content>
			</Card>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	card: {
		elevation: 4,
	},
	soldCard: {
		borderWidth: 2,
		borderColor: "#4CAF50", // Green color
	},
	imageContainer: {
		position: "relative",
	},
	image: {
		width: "100%",
		aspectRatio: 1,
		resizeMode: "cover",
		marginBottom: 8,
		borderRadius: 8,
		borderBottomEndRadius: 0,
		borderBottomStartRadius: 0,
	},
	soldBadge: {
		position: "absolute",
		top: 10,
		right: 10,
		backgroundColor: "#4CAF50", // Green color
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 4,
	},
	soldBadgeText: {
		color: "white",
		fontWeight: "bold",
		fontSize: 12,
	},
	loadingContainer: {
		justifyContent: "center",
		alignItems: "center",
	},
	chipsWrapper: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 4,
	},
	chipBox: {
		borderRadius: 6,
		borderColor: "#555",
	},
	chip: {
		padding: 0,
		fontSize: 12,
	},
	priceContainer: {
		justifyContent: "space-between",
		marginTop: 8,
	},
});

export default GemstoneCard;
