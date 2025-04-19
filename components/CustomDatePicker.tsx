import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
} from 'react-native';

interface CustomDatePickerProps {
    isVisible: boolean;
    onClose: () => void;
    onConfirm: (date: Date) => void;
    selectedDate: Date;
    colors: any;
}

const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ isVisible, onClose, onConfirm, selectedDate, colors }) => {
    const [date, setDate] = useState(selectedDate || new Date());
    const [view, setView] = useState<'date' | 'time'>('date');

    // Arrays of days, months, years, hours, and minutes
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const updateDate = (day?: number, month?: number, year?: number, hour?: number, minute?: number) => {
        const newDate = new Date(date);
        if (day !== undefined) newDate.setDate(day);
        if (month !== undefined) newDate.setMonth(month);
        if (year !== undefined) newDate.setFullYear(year);
        if (hour !== undefined) newDate.setHours(hour);
        if (minute !== undefined) newDate.setMinutes(minute);
        setDate(newDate);
    };

    const confirmSelection = () => {
        onConfirm(date);
        onClose();
    };

    const renderDatePicker = () => (
        <View style={styles.pickerContainer}>
            <Text style={[styles.header, { color: colors.text }]}>Select Date</Text>

            <View style={styles.dateContainer}>
                {/* Month Picker */}
                <View style={styles.pickerColumn}>
                    <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Month</Text>
                    <ScrollView style={styles.pickerScrollView}>
                        {months.map((month, index) => (
                            <TouchableOpacity
                                key={month}
                                style={[
                                    styles.pickerItem,
                                    date.getMonth() === index &&
                                    { backgroundColor: colors.primary, borderRadius: 8, marginHorizontal: 5 }
                                ]}
                                onPress={() => updateDate(undefined, index)}
                            >
                                <Text
                                    style={[
                                        styles.pickerItemText,
                                        { color: colors.text },
                                        date.getMonth() === index && { color: 'white', fontWeight: 'bold' }
                                    ]}
                                >
                                    {month}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Day Picker */}
                <View style={styles.pickerColumn}>
                    <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Day</Text>
                    <ScrollView style={styles.pickerScrollView}>
                        {days.map(day => (
                            <TouchableOpacity
                                key={day}
                                style={[
                                    styles.pickerItem,
                                    date.getDate() === day &&
                                    { backgroundColor: colors.primary, borderRadius: 8, marginHorizontal: 5 }
                                ]}
                                onPress={() => updateDate(day)}
                            >
                                <Text
                                    style={[
                                        styles.pickerItemText,
                                        { color: colors.text },
                                        date.getDate() === day && { color: 'white', fontWeight: 'bold' }
                                    ]}
                                >
                                    {day}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Year Picker */}
                <View style={styles.pickerColumn}>
                    <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Year</Text>
                    <ScrollView style={styles.pickerScrollView}>
                        {years.map(year => (
                            <TouchableOpacity
                                key={year}
                                style={[
                                    styles.pickerItem,
                                    date.getFullYear() === year &&
                                    { backgroundColor: colors.primary, borderRadius: 8, marginHorizontal: 5 }
                                ]}
                                onPress={() => updateDate(undefined, undefined, year)}
                            >
                                <Text
                                    style={[
                                        styles.pickerItemText,
                                        { color: colors.text },
                                        date.getFullYear() === year && { color: 'white', fontWeight: 'bold' }
                                    ]}
                                >
                                    {year}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.timeButton, { backgroundColor: colors.primary }]}
                onPress={() => setView('time')}
            >
                <Text style={styles.timeButtonText}>Set Time</Text>
            </TouchableOpacity>
        </View>
    );

    const renderTimePicker = () => (
        <View style={styles.pickerContainer}>
            <Text style={[styles.header, { color: colors.text }]}>Select Time</Text>

            <View style={styles.timeContainer}>
                {/* Hour Picker */}
                <View style={styles.pickerColumn}>
                    <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Hour</Text>
                    <ScrollView style={styles.pickerScrollView}>
                        {hours.map(hour => (
                            <TouchableOpacity
                                key={hour}
                                style={[
                                    styles.pickerItem,
                                    date.getHours() === hour &&
                                    { backgroundColor: colors.primary, borderRadius: 8, marginHorizontal: 5 }
                                ]}
                                onPress={() => updateDate(undefined, undefined, undefined, hour)}
                            >
                                <Text
                                    style={[
                                        styles.pickerItemText,
                                        { color: colors.text },
                                        date.getHours() === hour && { color: 'white', fontWeight: 'bold' }
                                    ]}
                                >
                                    {hour.toString().padStart(2, '0')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Minute Picker */}
                <View style={styles.pickerColumn}>
                    <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Minute</Text>
                    <ScrollView style={styles.pickerScrollView}>
                        {minutes.map(minute => (
                            <TouchableOpacity
                                key={minute}
                                style={[
                                    styles.pickerItem,
                                    date.getMinutes() === minute &&
                                    { backgroundColor: colors.primary, borderRadius: 8, marginHorizontal: 5 }
                                ]}
                                onPress={() => updateDate(undefined, undefined, undefined, undefined, minute)}
                            >
                                <Text
                                    style={[
                                        styles.pickerItemText,
                                        { color: colors.text },
                                        date.getMinutes() === minute && { color: 'white', fontWeight: 'bold' }
                                    ]}
                                >
                                    {minute.toString().padStart(2, '0')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.timeButton, { backgroundColor: colors.primary }]}
                onPress={() => setView('date')}
            >
                <Text style={styles.timeButtonText}>Back to Date</Text>
            </TouchableOpacity>
        </View>
    );

    if (!isVisible) return null;

    return (
        <Modal
            transparent={true}
            animationType="slide"
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={{ color: colors.textSecondary, fontSize: 16 }}>Cancel</Text>
                        </TouchableOpacity>

                        <Text style={{ color: colors.text, fontSize: 18, fontWeight: 'bold' }}>
                            Select {view === 'date' ? 'Date' : 'Time'}
                        </Text>

                        <TouchableOpacity onPress={confirmSelection}>
                            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: 'bold' }}>Confirm</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.currentDateContainer}>
                        <Text style={[styles.currentDateText, { color: colors.primary }]}>
                            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>

                    {view === 'date' ? renderDatePicker() : renderTimePicker()}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.8)', // Darker background to avoid transparency
        paddingTop: 80,
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        padding: 16,
        paddingBottom: 30,
        height: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    currentDateContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    currentDateText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    pickerContainer: {
        flex: 1,
    },
    header: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    dateContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: 200,
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        height: 200,
    },
    pickerColumn: {
        flex: 1,
        marginHorizontal: 5,
    },
    pickerLabel: {
        fontSize: 14,
        marginBottom: 8,
        textAlign: 'center',
    },
    pickerScrollView: {
        flex: 1,
    },
    pickerItem: {
        padding: 10,
        alignItems: 'center',
        borderRadius: 8,
        marginVertical: 2,
    },
    pickerItemText: {
        fontSize: 16,
    },
    timeButton: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    timeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default CustomDatePicker;