import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

const INITIAL_CONTACTS = [
  { id: '1', name: 'Henry Ramirez Jr', phone: '239-784-1766' },
  { id: '2', name: 'Henry Ramirez', phone: '239-784-5517' },
  { id: '3', name: 'Esmir Ramirez', phone: '239-784-3412' },
  { id: '4', name: 'Sofia Ramirez', phone: '239-577-1542' },
];

const SHEET_HEIGHT = Dimensions.get('window').height;

const sortContacts = (contacts) =>
  [...contacts].sort((a, b) => a.name.localeCompare(b.name));

const buildSections = (contacts, query) => {
  const normalizedQuery = query.trim().toLowerCase();
  const filteredContacts = sortContacts(contacts).filter((contact) => {
    if (!normalizedQuery) {
      return true;
    }

    return (
      contact.name.toLowerCase().includes(normalizedQuery) ||
      contact.phone.includes(normalizedQuery)
    );
  });

  const grouped = filteredContacts.reduce((accumulator, contact) => {
    const letter = contact.name.charAt(0).toUpperCase();
    const title = /[A-Z]/.test(letter) ? letter : '#';

    if (!accumulator[title]) {
      accumulator[title] = [];
    }

    accumulator[title].push(contact);
    return accumulator;
  }, {});

  return Object.keys(grouped)
    .sort()
    .map((title) => ({
      title,
      data: grouped[title],
    }));
};

const formatPhoneInput = (value) => value.replace(/[^0-9()\-\s]/g, '');

const getInitials = (name) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

export default function App() {
  const [contacts, setContacts] = useState(INITIAL_CONTACTS);
  const [showAddContact, setShowAddContact] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const sections = buildSections(contacts, searchQuery);
  const visibleCount = sections.reduce((total, section) => total + section.data.length, 0);

  const resetForm = () => {
    setNewContact({ name: '', phone: '' });
  };

  const handleShowForm = () => {
    setShowAddContact(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  };

  const handleHideForm = () => {
    Keyboard.dismiss();
    Animated.timing(slideAnim, {
      toValue: SHEET_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setShowAddContact(false);
      resetForm();
    });
  };

  const addContact = () => {
    const trimmedName = newContact.name.trim();
    const trimmedPhone = newContact.phone.trim();
    const isValidPhone = /^[0-9()\-\s]+$/.test(trimmedPhone);

    if (!trimmedName || !trimmedPhone || !isValidPhone) {
      Alert.alert('Invalid contact', 'Enter a name and a valid phone number.');
      return;
    }

    setContacts((currentContacts) => [
      ...currentContacts,
      {
        id: Date.now().toString(),
        name: trimmedName,
        phone: trimmedPhone,
      },
    ]);
    handleHideForm();
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const renderItem = ({ item }) => (
    <View style={styles.contactRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
      </View>
      <View style={styles.contactCopy}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phone}</Text>
      </View>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.largeTitle}>Contacts</Text>
              <Text style={styles.subtitle}>{visibleCount} people</Text>
            </View>
            <Pressable style={styles.addButton} onPress={handleShowForm}>
              <Text style={styles.addButtonText}>+</Text>
            </Pressable>
          </View>

          <View style={styles.searchCard}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#8E8E93"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.listShell}>
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              stickySectionHeadersEnabled
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.rowDivider} />}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No Contacts Found</Text>
                  <Text style={styles.emptyCopy}>Try another name or phone number.</Text>
                </View>
              }
              contentContainerStyle={styles.listContent}
            />
          </View>

          {showAddContact && (
            <View style={styles.overlay}>
              <Pressable style={styles.backdrop} onPress={handleHideForm} />
              <Animated.View
                style={[
                  styles.sheet,
                  {
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>New Contact</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#8E8E93"
                  value={newContact.name}
                  onChangeText={(text) =>
                    setNewContact((current) => ({
                      ...current,
                      name: text,
                    }))
                  }
                />

                <TextInput
                  style={styles.input}
                  placeholder="Phone Number"
                  placeholderTextColor="#8E8E93"
                  value={newContact.phone}
                  onChangeText={(text) =>
                    setNewContact((current) => ({
                      ...current,
                      phone: formatPhoneInput(text),
                    }))
                  }
                  keyboardType="phone-pad"
                />

                <View style={styles.sheetActions}>
                  <Pressable style={styles.secondaryAction} onPress={handleHideForm}>
                    <Text style={styles.secondaryActionText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.primaryAction} onPress={addContact}>
                    <Text style={styles.primaryActionText}>Save</Text>
                  </Pressable>
                </View>
              </Animated.View>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  largeTitle: {
    color: '#111111',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  subtitle: {
    marginTop: 4,
    color: '#6E6E73',
    fontSize: 15,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A84FF',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 24,
    fontWeight: '500',
    marginTop: -1,
  },
  searchCard: {
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginBottom: 16,
  },
  searchInput: {
    color: '#111111',
    fontSize: 16,
  },
  listShell: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
  },
  listContent: {
    paddingBottom: 18,
  },
  sectionHeader: {
    backgroundColor: '#F2F2F7',
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#D9E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#2457C5',
    fontSize: 15,
    fontWeight: '700',
  },
  contactCopy: {
    flex: 1,
  },
  contactName: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactPhone: {
    color: '#6E6E73',
    fontSize: 14,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginLeft: 72,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyTitle: {
    color: '#111111',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyCopy: {
    color: '#6E6E73',
    fontSize: 15,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 18,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D1D1D6',
    marginBottom: 16,
  },
  sheetTitle: {
    color: '#111111',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 18,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111111',
    marginBottom: 12,
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#E5E5EA',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
    marginRight: 8,
  },
  secondaryActionText: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryAction: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
    marginLeft: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
