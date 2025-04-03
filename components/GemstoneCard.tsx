import { Currency, CurrencySymbols } from "@/app/types/gemstone";
import { useLanguage } from "@/hooks/useLanguage";
import { Tables } from "@/lib/database.types";
import { getDefaultStoneImage } from "@/lib/imageUtils";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { Card } from "react-native-paper";
import { OptimizedImage } from "./OptimizedImage";
import { Badge } from "./ui/badge";
import { Muted, P } from "./ui/typography";

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
	const { t } = useLanguage();

	return (
		<Pressable
			onPress={() => router.push(`/(app)/gemstone/${gemstone.id}`)}
			className="h-full"
		>
			<Card
				className={`h-full ${gemstone.sold ? "border-2 border-green-500" : ""}`}
				style={{ elevation: 4 }}
			>
				<View className="h-full">
					<View className="relative">
						<OptimizedImage
							image={gemstone.images?.[0] || ""}
							placeholder={getDefaultStoneImage()}
							style={{
								width: "100%",
								aspectRatio: 1,
								marginBottom: 8,
								borderTopLeftRadius: 8,
								borderTopRightRadius: 8,
							}}
							contentFit="cover"
						/>
						{gemstone.sold && (
							<View className="absolute top-2.5 right-2.5 bg-red-500 px-2 py-1 rounded">
								<P className="text-white font-semibold whitespace-nowrap">
									{t("gemstones.sold")}
								</P>
							</View>
						)}
					</View>

					<Card.Content className="flex-1 flex flex-col justify-between gap-2 h-full pb-4">
						<View className="flex flex-row items-center gap-4">
							<P className="text-base font-bold">{gemstone.name}</P>
							<Muted className="font-bold">{gemstone.bill_number}</Muted>
						</View>
						<View className="flex-row flex-wrap gap-1 flex-1 h-full">
							{gemstone.shape && (
								<Badge variant="outline" className="rounded-md border-gray-600">
									<P className="p-0 text-xs">{gemstone.shape}</P>
								</Badge>
							)}
							{gemstone.weight && (
								<Badge variant="outline" className="rounded-md border-gray-600">
									<P className="p-0 text-xs">{gemstone.weight} ct</P>
								</Badge>
							)}
							{gemstone.color && (
								<Badge variant="outline" className="rounded-md border-gray-600">
									<P className="p-0 text-xs">{gemstone.color}</P>
								</Badge>
							)}
							{gemstone.cut && (
								<Badge variant="outline" className="rounded-md border-gray-600">
									<P className="p-0 text-xs">{gemstone.cut}</P>
								</Badge>
							)}
						</View>

						<View className="justify-between">
							<P className="text-green-500 font-semibold">
								{t("gemstones.buy")}: {gemstone.buy_price?.toFixed(2) || "0.00"}{" "}
								{getCurrencySymbol(gemstone.buy_currency)}
							</P>

							<P className="text-red-500 font-semibold">
								{t("gemstones.sell")}:{" "}
								{gemstone.sell_price?.toFixed(2) || "0.00"}{" "}
								{getCurrencySymbol(gemstone.sell_currency)}
							</P>
						</View>
					</Card.Content>
				</View>
			</Card>
		</Pressable>
	);
};

export default GemstoneCard;
