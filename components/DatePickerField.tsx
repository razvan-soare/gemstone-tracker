import { Platform, View } from "react-native";
import React, { useState, useCallback } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { DateTime } from "luxon";
import { Dialog, Portal, TextInput } from "react-native-paper";
import { Button } from "./ui/button";
import { Text } from "./ui/text";
import { Calendar } from "lucide-react-native";

interface DatePickerField2Props {
	date?: Date;
	onChange?: (date: Date | undefined) => void;
	placeholder?: string;
	label?: string;
	error?: boolean;
	className?: string;
}

const DATE_FORMAT = "dd-MM-yyyy";

export const DatePickerField: React.FC<DatePickerField2Props> = ({
	date,
	onChange,
	label,
	error,
	className,
}) => {
	const [dateString, setDateString] = useState(
		date ? DateTime.fromJSDate(date).toFormat(DATE_FORMAT) : "",
	);
	const [selectedDate, setSelectedDate] = useState(date || new Date());
	const [show, setShow] = useState(false);
	const [isInvalid, setIsInvalid] = useState(false);

	const handleDateChange = useCallback(
		(_event: any, newDate: Date | undefined) => {
			if (!newDate) return;

			const luxonDate = DateTime.fromJSDate(newDate);
			setDateString(luxonDate.toFormat(DATE_FORMAT));
			setSelectedDate(newDate);
			setIsInvalid(false);
			onChange?.(newDate);

			if (Platform.OS === "android") {
				setShow(false);
			}
		},
		[onChange],
	);

	const formatDateString = useCallback((input: string): string => {
		// Remove all non-numeric characters
		const numbers = input.replace(/\D/g, "");

		// Format the string as DD-MM-YYYY
		if (numbers.length <= 2) {
			return numbers;
		} else if (numbers.length <= 4) {
			return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
		} else {
			return `${numbers.slice(0, 2)}-${numbers.slice(2, 4)}-${numbers.slice(4, 8)}`;
		}
	}, []);

	const handleTextChange = useCallback(
		(text: string) => {
			// Format the input as the user types
			const formattedText = formatDateString(text);
			setDateString(formattedText);
			setIsInvalid(false);

			// Only attempt to parse if we have a complete date (DD-MM-YYYY)
			if (formattedText.length === 10) {
				const parsedDate = DateTime.fromFormat(formattedText, DATE_FORMAT);

				if (parsedDate.isValid) {
					const jsDate = parsedDate.toJSDate();
					setSelectedDate(jsDate);
					setIsInvalid(false);
					onChange?.(jsDate);
				} else {
					setIsInvalid(true);
				}
			} else if (formattedText.length === 0) {
				onChange?.(undefined);
			}

			const parsedDate = parseDateString(formattedText);

			if (parsedDate) {
				const jsDate = parsedDate.toJSDate();
				setSelectedDate(jsDate);
				setIsInvalid(false);
				onChange?.(jsDate);
			}
		},
		[formatDateString, onChange],
	);

	const parseDateString = (input: string): DateTime | null => {
		if (!input) return null;

		let parsedDate = DateTime.fromFormat(input, DATE_FORMAT);

		if (!parsedDate.isValid) {
			const twoDigitYearFormat = "dd-MM-yy";
			parsedDate = DateTime.fromFormat(input, twoDigitYearFormat);
			if (parsedDate.isValid) {
				parsedDate = parsedDate;
			}
		}

		if (!parsedDate.isValid) {
			return null;
		}

		return parsedDate;
	};

	const handleBlur = () => {
		if (!dateString) return;

		const parsedDate = parseDateString(dateString);

		if (!parsedDate) {
			setIsInvalid(true);
			return;
		}

		setDateString(parsedDate.toFormat(DATE_FORMAT));
		const jsDate = parsedDate.toJSDate();
		setIsInvalid(false);
		setSelectedDate(jsDate);
		onChange?.(jsDate);
	};

	const showOverlay = useCallback(() => setShow(true), []);
	const hideOverlay = useCallback(() => setShow(false), []);

	return (
		<View className={`flex-1 ${className || ""}`}>
			<View className="flex-row items-center">
				<View className="flex-1">
					<TextInput
						mode="outlined"
						label={label || "Date"}
						value={dateString}
						onChangeText={handleTextChange}
						placeholder="DD-MM-YYYY"
						error={error || isInvalid}
						keyboardType="numeric"
						onBlur={() => handleBlur()}
						maxLength={10}
						clearButtonMode="always"
						right={
							<TextInput.Icon
								icon={() => <Calendar size={20} color="black" />}
								onPress={showOverlay}
							/>
						}
					/>
				</View>
			</View>
			{isInvalid && (
				<Text className="text-sm text-destructive mt-1">
					Invalid date format
				</Text>
			)}

			{Platform.OS === "ios" ? (
				<Portal>
					<Dialog visible={show} onDismiss={hideOverlay}>
						<Dialog.Title>Select Date</Dialog.Title>
						<Dialog.Content>
							<DateTimePicker
								value={selectedDate}
								mode="date"
								is24Hour={true}
								display="spinner"
								onChange={handleDateChange}
							/>
						</Dialog.Content>
						<Dialog.Actions>
							<Button variant="ghost" onPress={hideOverlay}>
								<Text>Cancel</Text>
							</Button>
							<Button variant="default" onPress={hideOverlay}>
								<Text>Done</Text>
							</Button>
						</Dialog.Actions>
					</Dialog>
				</Portal>
			) : (
				show && (
					<DateTimePicker
						value={selectedDate}
						mode="date"
						is24Hour={true}
						display="default"
						onChange={handleDateChange}
					/>
				)
			)}
		</View>
	);
};
