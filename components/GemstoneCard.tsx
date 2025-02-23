import { Tables } from "@/lib/database.types";
import { Image, StyleSheet, View } from "react-native";
import { Card, Chip, Title } from "react-native-paper";
import { P } from "./ui/typography";

const GemstoneCard = ({ gemstone }: { gemstone: Tables<"stones"> }) => {
	return (
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
					<Chip mode="outlined">
						<P style={styles.chip}>{gemstone.shape}</P>
					</Chip>
					<Chip mode="outlined">
						<P style={styles.chip}>{gemstone.weight} kt</P>
					</Chip>
					<Chip mode="outlined">
						<P style={styles.chip}>{gemstone.color}</P>
					</Chip>
					<Chip mode="outlined">
						<P style={styles.chip}>{gemstone.cut}</P>
					</Chip>
				</View>
			</Card.Content>
		</Card>
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
	chip: {
		padding: 0,
		fontSize: 12,
	},
});

export default GemstoneCard;
