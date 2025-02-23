import { Tables } from "@/lib/database.types";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Card, Title } from "react-native-paper";
import { Badge } from "./ui/badge";
import { P } from "./ui/typography";
import { router } from "expo-router";

const GemstoneCard = ({ gemstone }: { gemstone: Tables<"stones"> }) => {
	return (
		<Pressable onPress={() => router.push(`/(app)/gemstone/${gemstone.id}`)}>
			<Card style={styles.card}>
				<Image
					source={{
						uri:
							gemstone.pictures?.[0] ||
							"https://place-hold.it/300x300.jpg/666/fff/000",
					}}
					style={styles.image}
				/>
				<Card.Content>
					<Title style={styles.title}>{gemstone.name}</Title>
					<View style={styles.chipsWrapper}>
						<Badge variant="outline" style={styles.chipBox}>
							<P style={styles.chip}>{gemstone.shape}</P>
						</Badge>
						<Badge variant="outline" style={styles.chipBox}>
							<P style={styles.chip}>{gemstone.weight} kt</P>
						</Badge>
						<Badge variant="outline" style={styles.chipBox}>
							<P style={styles.chip}>{gemstone.color}</P>
						</Badge>
						<Badge variant="outline" style={styles.chipBox}>
							<P style={styles.chip}>{gemstone.cut}</P>
						</Badge>
					</View>
				</Card.Content>
			</Card>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	title: {
		fontSize: 16,
		fontWeight: "bold",
	},
	card: {
		elevation: 4,
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
});

export default GemstoneCard;
