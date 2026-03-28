import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const INITIAL_CONTACTS = [
  { id: '1', name: 'Henry Ramirez Jr', phone: '239-784-1766', note: 'My card', favorite: true },
  { id: '2', name: 'Brian Abby (husband)', phone: '239-784-5517', favorite: true },
  { id: '3', name: 'Abel', phone: '239-784-3412', favorite: false },
  { id: '4', name: 'Abimaer', phone: '239-577-1542', favorite: false },
  { id: '5', name: 'Abraham', phone: '239-577-1543', favorite: false },
  { id: '6', name: 'Alex ACV', phone: '239-577-1544', favorite: false },
  { id: '7', name: 'Adam', phone: '239-577-1545', favorite: false },
  { id: '8', name: 'Adam DR', phone: '239-577-1546', favorite: false },
  { id: '9', name: 'Adji', phone: '239-577-1547', favorite: false },
  { id: '10', name: 'Adonis', phone: '239-577-1548', favorite: false },
  { id: '11', name: 'Adriana', phone: '239-577-1549', favorite: false },
  { id: '12', name: 'Sofia Ramirez', phone: '239-577-1550', favorite: true },
];

const INITIAL_RECENTS = [
  { id: 'r1', name: 'Brian Abby (husband)', phone: '239-784-5517', type: 'Outgoing', time: 'Today' },
  { id: 'r2', name: 'Sofia Ramirez', phone: '239-577-1550', type: 'Missed', time: 'Yesterday' },
  { id: 'r3', name: 'Adonis', phone: '239-577-1548', type: 'Incoming', time: 'Thursday' },
];

const TABS = [
  { key: 'favorites', label: 'Favorites', icon: 'star', activeIcon: 'star' },
  { key: 'recents', label: 'Recents', icon: 'time', activeIcon: 'time' },
  { key: 'contacts', label: 'Contacts', icon: 'person-circle', activeIcon: 'person-circle' },
  { key: 'keypad', label: 'Keypad', icon: 'keypad', activeIcon: 'keypad' },
  { key: 'voicemail', label: 'Voicemail', icon: 'voicemail' },
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const SHEET_HEIGHT = Dimensions.get('window').height;
const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['*', '0', '#'],
];

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
      contact.phone.includes(normalizedQuery) ||
      (contact.note ?? '').toLowerCase().includes(normalizedQuery)
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

const getAvatarPalette = (name) => {
  const palettes = [
    { background: '#5A4E7C', text: '#F5F0FF' },
    { background: '#6A6687', text: '#F6F5FF' },
    { background: '#A85A7B', text: '#FFF0F6' },
    { background: '#57627E', text: '#EFF3FF' },
  ];
  const sum = name.split('').reduce((total, character) => total + character.charCodeAt(0), 0);
  return palettes[sum % palettes.length];
};

const getTabTitle = (activeTab) => {
  switch (activeTab) {
    case 'favorites':
      return 'Favorites';
    case 'recents':
      return 'Recents';
    case 'contacts':
      return 'Contacts';
    case 'keypad':
      return 'Keypad';
    case 'voicemail':
      return 'Voicemail';
    default:
      return 'Contacts';
  }
};

const getRecentToneColor = (type) => {
  if (type === 'Missed') {
    return '#FF6B6B';
  }
  return '#8C8C92';
};

export default function App() {
  const [contacts, setContacts] = useState(INITIAL_CONTACTS);
  const [recents, setRecents] = useState(INITIAL_RECENTS);
  const [activeTab, setActiveTab] = useState('contacts');
  const [showAddContact, setShowAddContact] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newContact, setNewContact] = useState({ name: '', phone: '' });
  const [dialedNumber, setDialedNumber] = useState('');
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const sectionListRef = useRef(null);

  const sections = useMemo(() => buildSections(contacts, searchQuery), [contacts, searchQuery]);
  const favoriteContacts = useMemo(
    () => sortContacts(contacts.filter((contact) => contact.favorite)),
    [contacts]
  );

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

    const createdContact = {
      id: Date.now().toString(),
      name: trimmedName,
      phone: trimmedPhone,
      favorite: false,
    };

    setContacts((currentContacts) => [...currentContacts, createdContact]);
    setRecents((currentRecents) => [
      {
        id: `r-${Date.now()}`,
        name: trimmedName,
        phone: trimmedPhone,
        type: 'Added',
        time: 'Just now',
      },
      ...currentRecents,
    ]);
    setActiveTab('contacts');
    setSearchQuery('');
    handleHideForm();
  };

  const toggleFavorite = (contactId) => {
    setContacts((currentContacts) =>
      currentContacts.map((contact) =>
        contact.id === contactId
          ? { ...contact, favorite: !contact.favorite }
          : contact
      )
    );
  };

  const jumpToSection = (letter) => {
    const sectionIndex = sections.findIndex((section) => section.title === letter);

    if (sectionIndex >= 0 && sectionListRef.current) {
      sectionListRef.current.scrollToLocation({
        sectionIndex,
        itemIndex: 0,
        animated: false,
        viewOffset: 0,
      });
    }
  };

  const appendDigit = (digit) => {
    setDialedNumber((current) => `${current}${digit}`);
  };

  const deleteDigit = () => {
    setDialedNumber((current) => current.slice(0, -1));
  };

  const placeCall = () => {
    if (!dialedNumber) {
      Alert.alert('No number entered', 'Type a phone number to place a call.');
      return;
    }

    const matchedContact = contacts.find((contact) => contact.phone.includes(dialedNumber));
    const displayName = matchedContact ? matchedContact.name : 'Unknown';

    setRecents((currentRecents) => [
      {
        id: `r-${Date.now()}`,
        name: displayName,
        phone: dialedNumber,
        type: 'Outgoing',
        time: 'Just now',
      },
      ...currentRecents,
    ]);
    setActiveTab('recents');
    setDialedNumber('');
  };

  const renderContactRow = ({ item }) => {
    const palette = getAvatarPalette(item.name);

    return (
      <View style={styles.contactRow}>
        <View style={[styles.avatar, { backgroundColor: palette.background }]}>
          <Text style={[styles.avatarText, { color: palette.text }]}>{getInitials(item.name)}</Text>
        </View>

        <View style={styles.contactCopy}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactMeta}>{item.note ?? item.phone}</Text>
        </View>

        <Pressable style={styles.inlineIconButton} onPress={() => toggleFavorite(item.id)}>
          <Ionicons
            name={item.favorite ? 'star' : 'star-outline'}
            size={19}
            color={item.favorite ? '#FFD45C' : '#7C7C82'}
          />
        </Pressable>
      </View>
    );
  };

  const renderFavorites = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
      <Text style={styles.panelIntro}>Tap the star on any contact to add or remove favorites.</Text>
      {favoriteContacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyCopy}>Star a contact from the Contacts tab to see them here.</Text>
        </View>
      ) : (
        favoriteContacts.map((contact) => {
          const palette = getAvatarPalette(contact.name);

          return (
            <View key={contact.id} style={styles.cardRow}>
              <View style={[styles.avatarLarge, { backgroundColor: palette.background }]}>
                <Text style={[styles.avatarText, { color: palette.text }]}>{getInitials(contact.name)}</Text>
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>{contact.name}</Text>
                <Text style={styles.cardSubtitle}>{contact.phone}</Text>
              </View>
              <Pressable style={styles.inlineIconButton} onPress={() => toggleFavorite(contact.id)}>
                <Ionicons name="star" size={20} color="#FFD45C" />
              </Pressable>
            </View>
          );
        })
      )}
    </ScrollView>
  );

  const renderRecents = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
      {recents.map((entry) => (
        <View key={entry.id} style={styles.recentRow}>
          <View>
            <Text style={styles.recentName}>{entry.name}</Text>
            <Text style={[styles.recentType, { color: getRecentToneColor(entry.type) }]}>
              {entry.type} • {entry.phone}
            </Text>
          </View>
          <Text style={styles.recentTime}>{entry.time}</Text>
        </View>
      ))}
    </ScrollView>
  );

  const renderContacts = () => (
    <>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#A2A2A7" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#8A8A8F"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <MaterialCommunityIcons name="microphone-outline" size={20} color="#E5E5EA" />
      </View>

      <View style={styles.listFrame}>
        <SectionList
          ref={sectionListRef}
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderContactRow}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionHeader}>{title}</Text>
          )}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.rowDivider} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No contacts found</Text>
              <Text style={styles.emptyCopy}>Try another name or phone number.</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          onScrollToIndexFailed={() => {}}
        />

        <View style={styles.alphabetRail}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.railContent}>
            {ALPHABET.map((letter) => {
              const isEnabled = sections.some((section) => section.title === letter);

              return (
                <Pressable
                  key={letter}
                  style={styles.railLetterWrap}
                  onPress={() => jumpToSection(letter)}
                >
                  <Text style={[styles.railLetter, !isEnabled && styles.railLetterDisabled]}>
                    {letter}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </>
  );

  const renderKeypad = () => (
    <View style={styles.keypadScreen}>
      <Text style={styles.dialedNumber}>{dialedNumber || 'Enter number'}</Text>

      <View style={styles.keypadGrid}>
        {KEYPAD_ROWS.flat().map((digit) => (
          <Pressable key={digit} style={styles.keypadButton} onPress={() => appendDigit(digit)}>
            <Text style={styles.keypadDigit}>{digit}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.keypadActions}>
        <Pressable style={styles.callButton} onPress={placeCall}>
          <Ionicons name="call" size={24} color="#FFFFFF" />
        </Pressable>
        <Pressable style={styles.deleteButton} onPress={deleteDigit}>
          <Ionicons name="backspace-outline" size={24} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );

  const renderVoicemail = () => (
    <View style={styles.centerPanel}>
      <MaterialCommunityIcons name="voicemail" size={54} color="#FFFFFF" />
      <Text style={styles.centerTitle}>Voicemail</Text>
      <Text style={styles.centerCopy}>326 unheard messages waiting in your inbox.</Text>
    </View>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'favorites':
        return renderFavorites();
      case 'recents':
        return renderRecents();
      case 'contacts':
        return renderContacts();
      case 'keypad':
        return renderKeypad();
      case 'voicemail':
        return renderVoicemail();
      default:
        return renderContacts();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.topBar}>
            <Pressable style={styles.circleButton}>
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>

            <Text style={styles.title}>{getTabTitle(activeTab)}</Text>

            <Pressable
              style={styles.circleButton}
              onPress={handleShowForm}
              disabled={activeTab !== 'contacts'}
            >
              <Ionicons
                name="add"
                size={22}
                color={activeTab === 'contacts' ? '#FFFFFF' : '#5A5A60'}
              />
            </Pressable>
          </View>

          <View style={styles.contentArea}>{renderActiveTab()}</View>

          <View style={styles.bottomTabBar}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const isVoicemail = tab.key === 'voicemail';
              const icon =
                isVoicemail ? (
                  <View style={styles.voicemailIconWrap}>
                    <MaterialCommunityIcons
                      name="voicemail"
                      size={22}
                      color={isActive ? '#30A7FF' : '#FFFFFF'}
                    />
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>326</Text>
                    </View>
                  </View>
                ) : (
                  <Ionicons
                    name={tab.icon}
                    size={tab.key === 'contacts' ? 22 : 20}
                    color={isActive ? '#30A7FF' : '#FFFFFF'}
                  />
                );

              return (
                <Pressable
                  key={tab.key}
                  style={[styles.tabItem, isActive && styles.activeTab]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  {icon}
                  <Text style={isActive ? styles.activeTabLabel : styles.tabLabel}>{tab.label}</Text>
                </Pressable>
              );
            })}
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
                  placeholder="Full name"
                  placeholderTextColor="#8A8A8F"
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
                  placeholder="Phone number"
                  placeholderTextColor="#8A8A8F"
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
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1D1D1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  contentArea: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171717',
    borderRadius: 15,
    paddingHorizontal: 14,
    height: 44,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 17,
    marginLeft: 8,
    marginRight: 8,
  },
  listFrame: {
    flex: 1,
    flexDirection: 'row',
  },
  listContent: {
    paddingBottom: 110,
  },
  sectionHeader: {
    color: '#8C8C92',
    fontSize: 15,
    fontWeight: '700',
    paddingTop: 12,
    paddingBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingRight: 6,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  contactCopy: {
    flex: 1,
  },
  contactName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  contactMeta: {
    color: '#8C8C92',
    fontSize: 15,
    marginTop: 1,
  },
  inlineIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#202022',
    marginLeft: 50,
  },
  alphabetRail: {
    width: 18,
    marginLeft: 2,
    paddingBottom: 110,
  },
  railContent: {
    paddingTop: 72,
    paddingBottom: 12,
    justifyContent: 'center',
  },
  railLetterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 14,
  },
  railLetter: {
    color: '#2EA6FF',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 11,
  },
  railLetterDisabled: {
    color: '#19476B',
  },
  panelContent: {
    paddingBottom: 110,
  },
  panelIntro: {
    color: '#8C8C92',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141416',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#232327',
  },
  cardCopy: {
    flex: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: '#8C8C92',
    fontSize: 14,
    marginTop: 3,
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#202022',
  },
  recentName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  recentType: {
    fontSize: 14,
    marginTop: 4,
  },
  recentTime: {
    color: '#8C8C92',
    fontSize: 14,
    marginLeft: 12,
  },
  keypadScreen: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 110,
  },
  dialedNumber: {
    color: '#FFFFFF',
    fontSize: 32,
    letterSpacing: 1,
    marginBottom: 28,
    minHeight: 42,
  },
  keypadGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    maxWidth: 320,
  },
  keypadButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1B1B1D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#2B2B2F',
  },
  keypadDigit: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '500',
  },
  keypadActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  callButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#2AC769',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  deleteButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1B1B1D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 110,
    paddingHorizontal: 30,
  },
  centerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 8,
  },
  centerCopy: {
    color: '#8C8C92',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomTabBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    height: 68,
    borderRadius: 26,
    backgroundColor: '#1B1B1D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#2A2A2D',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 22,
  },
  activeTab: {
    backgroundColor: '#343436',
  },
  tabLabel: {
    color: '#E5E5EA',
    fontSize: 10,
    marginTop: 4,
  },
  activeTabLabel: {
    color: '#30A7FF',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '700',
  },
  voicemailIconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -16,
    minWidth: 24,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF453A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyCopy: {
    color: '#8C8C92',
    fontSize: 15,
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
  },
  sheet: {
    backgroundColor: '#111214',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: '#242428',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#4A4A4F',
    marginBottom: 16,
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 18,
  },
  input: {
    backgroundColor: '#1A1A1D',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#252529',
  },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: '#2A2A2E',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
    marginRight: 8,
  },
  secondaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  primaryAction: {
    flex: 1,
    backgroundColor: '#0A84FF',
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
