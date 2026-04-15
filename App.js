import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const CONTACT_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'notes', label: 'Notes' },
];

const INITIAL_CONTACTS = [
  { id: '1', name: 'Henry Ramirez Jr', phone: '239-784-6746', note: 'My card', favorite: true },
  { id: '2', name: 'Brian Abby (husband)', phone: '239-784-7865', favorite: true },
  { id: '3', name: 'Abel', phone: '239-784-2314', favorite: false },
  { id: '4', name: 'Abimaer', phone: '239-577-1726', favorite: false },
  { id: '5', name: 'Abraham', phone: '239-577-8769', favorite: false },
  { id: '6', name: 'Alex ACV', phone: '239-577-8944', favorite: false },
  { id: '7', name: 'Adam', phone: '239-577-3825', favorite: false },
  { id: '8', name: 'Adam DR', phone: '239-577-3287', favorite: false },
  { id: '9', name: 'Adji', phone: '239-577-0291', favorite: false },
  { id: '10', name: 'Adonis', phone: '239-577-2763', favorite: false },
  { id: '11', name: 'Adriana', phone: '239-577-9827', favorite: false },
  { id: '12', name: 'Sofia Ramirez', phone: '239-577-9309', favorite: true },
];

const INITIAL_RECENTS = [
  { id: 'r1', name: 'Brian Abby (husband)', phone: '239-784-6547', type: 'Outgoing', time: 'Today' },
  { id: 'r2', name: 'Sofia Ramirez', phone: '239-577-9780', type: 'Missed', time: 'Yesterday' },
  { id: 'r3', name: 'Adonis', phone: '239-577-7654', type: 'Incoming', time: 'Thursday' },
];

const INITIAL_VOICEMAILS = [
  {
    id: 'v1',
    name: 'Brian Abby (husband)',
    phone: '239-784-7865',
    time: 'Today, 8:42 PM',
    duration: '0:27',
    transcript:
      'Hey love, I just left the store. Call me when you are free so I can see if you need anything else.',
    unread: true,
  },
  {
    id: 'v2',
    name: 'Unknown',
    phone: '(800) 555-0148',
    time: 'Today, 1:16 PM',
    duration: '1:04',
    transcript:
      'This is a reminder that your delivery window has been updated. Please check the app for your new arrival time.',
    unread: true,
  },
  {
    id: 'v3',
    name: 'Sofia Ramirez',
    phone: '239-577-9309',
    time: 'Yesterday',
    duration: '0:15',
    transcript:
      'Abuelo is asking if we are still doing dinner on Sunday. Text me back when you get a second.',
    unread: false,
  },
  {
    id: 'v4',
    name: 'Dr. Patel Office',
    phone: '(239) 555-0192',
    time: 'Friday',
    duration: '0:41',
    transcript:
      'Calling to confirm your appointment for next week. Please arrive ten minutes early for check-in.',
    unread: false,
  },
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
const KEYPAD_SUBLABELS = {
  '1': '',
  '2': 'ABC',
  '3': 'DEF',
  '4': 'GHI',
  '5': 'JKL',
  '6': 'MNO',
  '7': 'PQRS',
  '8': 'TUV',
  '9': 'WXYZ',
  '*': '',
  '0': '+',
  '#': '',
};

const sortContacts = (contacts) =>
  [...contacts].sort((a, b) => a.name.localeCompare(b.name));

const buildSections = (contacts, query, filter = 'all') => {
  const normalizedQuery = query.trim().toLowerCase();
  const filteredContacts = sortContacts(contacts).filter((contact) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'favorites' && contact.favorite) ||
      (filter === 'notes' && contact.note);

    if (!matchesFilter) {
      return false;
    }

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
  const [voicemails, setVoicemails] = useState(INITIAL_VOICEMAILS);
  const [activeTab, setActiveTab] = useState('contacts');
  const [showAddContact, setShowAddContact] = useState(false);
  const [formMode, setFormMode] = useState('add');
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactFilter, setContactFilter] = useState('all');
  const [newContact, setNewContact] = useState({ name: '', phone: '', note: '' });
  const [dialedNumber, setDialedNumber] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [activityMessage, setActivityMessage] = useState('Your contacts are ready.');
  const [expandedVoicemailId, setExpandedVoicemailId] = useState(null);
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const sectionListRef = useRef(null);

  const sections = useMemo(
    () => buildSections(contacts, searchQuery, contactFilter),
    [contacts, searchQuery, contactFilter]
  );
  const favoriteContacts = useMemo(
    () => sortContacts(contacts.filter((contact) => contact.favorite)),
    [contacts]
  );
  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) ?? null,
    [contacts, selectedContactId]
  );
  const unreadVoicemailCount = useMemo(
    () => voicemails.filter((voicemail) => voicemail.unread).length,
    [voicemails]
  );
  const contactsWithNotesCount = useMemo(
    () => contacts.filter((contact) => !!contact.note).length,
    [contacts]
  );
  const topRecent = useMemo(() => recents[0] ?? null, [recents]);
  const visibleContactCount = useMemo(
    () => sections.reduce((total, section) => total + section.data.length, 0),
    [sections]
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!activityMessage) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setActivityMessage('');
    }, 2600);

    return () => clearTimeout(timer);
  }, [activityMessage]);

  const resetForm = () => {
    setNewContact({ name: '', phone: '', note: '' });
  };

  const announce = (message) => {
    setActivityMessage(message);
  };

  const handleShowForm = (mode = 'add', contact = null) => {
    setFormMode(mode);
    setNewContact(
      contact
        ? {
            name: contact.name,
            phone: contact.phone,
            note: contact.note ?? '',
          }
        : { name: '', phone: '', note: '' }
    );
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
      setFormMode('add');
      resetForm();
    });
  };

  const saveContact = () => {
    const trimmedName = newContact.name.trim();
    const trimmedPhone = newContact.phone.trim();
    const trimmedNote = newContact.note.trim();
    const isValidPhone = /^[0-9()\-\s]+$/.test(trimmedPhone);

    if (!trimmedName || !trimmedPhone || !isValidPhone) {
      Alert.alert('Invalid contact', 'Enter a name and a valid phone number.');
      return;
    }

    if (formMode === 'edit' && selectedContact) {
      setContacts((currentContacts) =>
        currentContacts.map((contact) =>
          contact.id === selectedContact.id
            ? {
                ...contact,
                name: trimmedName,
                phone: trimmedPhone,
                note: trimmedNote || undefined,
              }
            : contact
        )
      );
      setRecents((currentRecents) => [
        {
          id: `r-${Date.now()}`,
          name: trimmedName,
          phone: trimmedPhone,
          type: 'Updated',
          time: 'Just now',
        },
        ...currentRecents,
      ]);
      announce(`Updated ${trimmedName}.`);
    } else {
      const createdContact = {
        id: Date.now().toString(),
        name: trimmedName,
        phone: trimmedPhone,
        note: trimmedNote || undefined,
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
      setSelectedContactId(createdContact.id);
      announce(`Added ${trimmedName} to your contacts.`);
    }

    setActiveTab('contacts');
    setSearchQuery('');
    setContactFilter('all');
    handleHideForm();
  };

  const toggleFavorite = (contactId) => {
    let nextFavoriteState = false;

    setContacts((currentContacts) =>
      currentContacts.map((contact) => {
        if (contact.id === contactId) {
          nextFavoriteState = !contact.favorite;
          return { ...contact, favorite: nextFavoriteState };
        }

        return contact;
      })
    );

    const contactName = contacts.find((contact) => contact.id === contactId)?.name ?? 'Contact';
    announce(
      nextFavoriteState ? `${contactName} added to favorites.` : `${contactName} removed from favorites.`
    );
  };

  const openContact = (contactId) => {
    setSelectedContactId(contactId);
    const contactName = contacts.find((contact) => contact.id === contactId)?.name;
    if (contactName) {
      announce(`Viewing ${contactName}.`);
    }
  };

  const handleBackAction = () => {
    if (selectedContactId) {
      setSelectedContactId(null);
      return;
    }

    Keyboard.dismiss();
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

  const placeCall = (phone = dialedNumber, contactOverride = null) => {
    if (!phone) {
      Alert.alert('No number entered', 'Type a phone number to place a call.');
      return;
    }

    const matchedContact = contactOverride ?? contacts.find((contact) => contact.phone.includes(phone));
    const displayName = matchedContact ? matchedContact.name : 'Unknown';

    setRecents((currentRecents) => [
      {
        id: `r-${Date.now()}`,
        name: displayName,
        phone,
        type: 'Outgoing',
        time: 'Just now',
      },
      ...currentRecents,
    ]);

    if (!contactOverride) {
      setActiveTab('recents');
      setDialedNumber('');
    }

    announce(`Calling ${displayName}.`);
    Alert.alert('Calling', `Calling ${displayName} at ${phone}.`);
  };

  const sendMessage = (contact) => {
    setRecents((currentRecents) => [
      {
        id: `r-${Date.now()}`,
        name: contact.name,
        phone: contact.phone,
        type: 'Message',
        time: 'Just now',
      },
      ...currentRecents,
    ]);
    announce(`Message shortcut opened for ${contact.name}.`);
    Alert.alert('Messages', `Opening a conversation with ${contact.name}.`);
  };

  const editSelectedContact = () => {
    if (selectedContact) {
      handleShowForm('edit', selectedContact);
    }
  };

  const deleteSelectedContact = () => {
    if (!selectedContact) {
      return;
    }

    Alert.alert('Delete Contact', `Remove ${selectedContact.name} from your contacts?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setContacts((currentContacts) =>
            currentContacts.filter((contact) => contact.id !== selectedContact.id)
          );
          announce(`${selectedContact.name} deleted.`);
          setSelectedContactId(null);
        },
      },
    ]);
  };

  const openRecentEntry = (entry) => {
    const matchedContact = contacts.find(
      (contact) => contact.phone === entry.phone || contact.name === entry.name
    );

    if (matchedContact) {
      setActiveTab('contacts');
      setSelectedContactId(matchedContact.id);
      announce(`Opened ${matchedContact.name} from recents.`);
      return;
    }

    Alert.alert('Contact not found', 'This recent item is not saved in your contacts.');
  };

  const handleTabChange = (tabKey) => {
    setSelectedContactId(null);
    setActiveTab(tabKey);
    setExpandedVoicemailId(null);
    announce(`${getTabTitle(tabKey)} tab open.`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    announce('Search cleared.');
  };

  const toggleVoicemailExpanded = (voicemailId) => {
    setExpandedVoicemailId((currentId) => (currentId === voicemailId ? null : voicemailId));
  };

  const markVoicemailHeard = (voicemailId) => {
    setVoicemails((currentVoicemails) =>
      currentVoicemails.map((voicemail) =>
        voicemail.id === voicemailId ? { ...voicemail, unread: false } : voicemail
      )
    );
  };

  const playVoicemail = (entry) => {
    markVoicemailHeard(entry.id);
    setExpandedVoicemailId(entry.id);
    announce(`Playing voicemail from ${entry.name}.`);
    Alert.alert('Voicemail', `Playing ${entry.duration} voicemail from ${entry.name}.`);
  };

  const callBackVoicemail = (entry) => {
    markVoicemailHeard(entry.id);
    placeCall(entry.phone, { name: entry.name, phone: entry.phone });
  };

  const applyContactFilter = (filterKey) => {
    setContactFilter(filterKey);
    announce(
      `${CONTACT_FILTERS.find((filter) => filter.key === filterKey)?.label ?? 'All'} contacts shown.`
    );
  };

  const renderContactRow = ({ item }) => {
    const palette = getAvatarPalette(item.name);

    return (
      <Pressable style={styles.contactRow} onPress={() => openContact(item.id)}>
        <View style={[styles.avatar, { backgroundColor: palette.background }]}>
          <Text style={[styles.avatarText, { color: palette.text }]}>{getInitials(item.name)}</Text>
        </View>

        <View style={styles.contactCopy}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactMeta}>{item.note ?? item.phone}</Text>
          <View style={styles.contactQuickActions}>
            <Pressable style={styles.contactChip} onPress={() => placeCall(item.phone, item)}>
              <Ionicons name="call-outline" size={13} color="#30A7FF" />
              <Text style={styles.contactChipText}>Call</Text>
            </Pressable>
            <Pressable style={styles.contactChip} onPress={() => sendMessage(item)}>
              <Ionicons name="chatbubble-outline" size={13} color="#30A7FF" />
              <Text style={styles.contactChipText}>Message</Text>
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.inlineIconButton} onPress={() => toggleFavorite(item.id)}>
          <Ionicons
            name={item.favorite ? 'star' : 'star-outline'}
            size={19}
            color={item.favorite ? '#FFD45C' : '#7C7C82'}
          />
        </Pressable>
      </Pressable>
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
            <Pressable key={contact.id} style={styles.cardRow} onPress={() => openContact(contact.id)}>
              <View style={[styles.avatarLarge, { backgroundColor: palette.background }]}>
                <Text style={[styles.avatarText, { color: palette.text }]}>{getInitials(contact.name)}</Text>
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.cardTitle}>{contact.name}</Text>
                <Text style={styles.cardSubtitle}>{contact.phone}</Text>
                <View style={styles.favoriteActions}>
                  <Pressable style={styles.smallActionChip} onPress={() => placeCall(contact.phone, contact)}>
                    <Text style={styles.smallActionChipText}>Call</Text>
                  </Pressable>
                  <Pressable style={styles.smallActionChip} onPress={() => sendMessage(contact)}>
                    <Text style={styles.smallActionChipText}>Message</Text>
                  </Pressable>
                </View>
              </View>
              <Pressable style={styles.inlineIconButton} onPress={() => toggleFavorite(contact.id)}>
                <Ionicons name="star" size={20} color="#FFD45C" />
              </Pressable>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );

  const renderRecents = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.panelContent}>
      {recents.map((entry) => (
        <Pressable key={entry.id} style={styles.recentCard} onPress={() => openRecentEntry(entry)}>
          <View style={styles.recentHeaderRow}>
            <View>
              <Text style={styles.recentName}>{entry.name}</Text>
              <Text style={[styles.recentType, { color: getRecentToneColor(entry.type) }]}>
                {`${entry.type} - ${entry.phone}`}
              </Text>
            </View>
            <Text style={styles.recentTime}>{entry.time}</Text>
          </View>

          <View style={styles.recentActions}>
            <Pressable
              style={styles.smallActionChip}
              onPress={() => placeCall(entry.phone, { name: entry.name, phone: entry.phone })}
            >
              <Text style={styles.smallActionChipText}>Call Again</Text>
            </Pressable>
            <Pressable style={styles.smallActionChip} onPress={() => openRecentEntry(entry)}>
              <Text style={styles.smallActionChipText}>Open Contact</Text>
            </Pressable>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );

  const renderContacts = () => (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.summaryRow}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Visible</Text>
          <Text style={styles.summaryValue}>{visibleContactCount}</Text>
          <Text style={styles.summaryHint}>Matching your current view</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Favorites</Text>
          <Text style={styles.summaryValue}>{favoriteContacts.length}</Text>
          <Text style={styles.summaryHint}>Your fastest people to reach</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Notes</Text>
          <Text style={styles.summaryValue}>{contactsWithNotesCount}</Text>
          <Text style={styles.summaryHint}>Contacts with extra context</Text>
        </View>
      </ScrollView>

      {topRecent && (
        <Pressable style={styles.spotlightCard} onPress={() => openRecentEntry(topRecent)}>
          <View style={styles.spotlightHeader}>
            <View>
              <Text style={styles.spotlightEyebrow}>Quick return</Text>
              <Text style={styles.spotlightTitle}>{topRecent.name}</Text>
            </View>
            <Text style={styles.spotlightTime}>{topRecent.time}</Text>
          </View>
          <Text style={styles.spotlightCopy}>{`${topRecent.type} on ${topRecent.phone}`}</Text>
          <View style={styles.spotlightActions}>
            <Pressable
              style={styles.spotlightButtonPrimary}
              onPress={() => placeCall(topRecent.phone, { name: topRecent.name, phone: topRecent.phone })}
            >
              <Ionicons name="call" size={15} color="#041119" />
              <Text style={styles.spotlightButtonPrimaryText}>Call</Text>
            </Pressable>
            <Pressable style={styles.spotlightButtonSecondary} onPress={() => openRecentEntry(topRecent)}>
              <Text style={styles.spotlightButtonSecondaryText}>Open</Text>
            </Pressable>
          </View>
        </Pressable>
      )}

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#A2A2A7" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search name, phone, or note"
          placeholderTextColor="#8A8A8F"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <Pressable onPress={clearSearch}>
            <Ionicons name="close-circle" size={18} color="#C6C6CB" />
          </Pressable>
        ) : (
          <MaterialCommunityIcons name="microphone-outline" size={20} color="#E5E5EA" />
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {CONTACT_FILTERS.map((filter) => {
          const isActive = contactFilter === filter.key;

          return (
            <Pressable
              key={filter.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => applyContactFilter(filter.key)}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

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
      <Text style={styles.keypadHint}>
        {dialedNumber ? 'Tap call to add this number to recents.' : 'Tap digits to start a call.'}
      </Text>

      <View style={styles.keypadGrid}>
        {KEYPAD_ROWS.flat().map((digit) => (
          <Pressable key={digit} style={styles.keypadButton} onPress={() => appendDigit(digit)}>
            <Text style={styles.keypadDigit}>{digit}</Text>
            {!!KEYPAD_SUBLABELS[digit] && <Text style={styles.keypadSubLabel}>{KEYPAD_SUBLABELS[digit]}</Text>}
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
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.voicemailContent}>
      <View style={styles.voicemailSummaryCard}>
        <View>
          <Text style={styles.voicemailSummaryLabel}>Visual Voicemail</Text>
          <Text style={styles.voicemailSummaryValue}>{unreadVoicemailCount} Unheard</Text>
        </View>
        <MaterialCommunityIcons name="voicemail" size={28} color="#30A7FF" />
      </View>

      {voicemails.map((entry) => (
        <Pressable
          key={entry.id}
          style={styles.voicemailRow}
          onPress={() => toggleVoicemailExpanded(entry.id)}
        >
          <View style={styles.voicemailRowTop}>
            <View style={styles.voicemailNameWrap}>
              {entry.unread && <View style={styles.voicemailUnreadDot} />}
              <Text style={[styles.voicemailName, entry.unread && styles.voicemailNameUnread]}>
                {entry.name}
              </Text>
            </View>
            <Text style={styles.voicemailTime}>{entry.time}</Text>
          </View>

          <View style={styles.voicemailMetaRow}>
            <Text style={styles.voicemailMetaText}>{entry.phone}</Text>
            <Text style={styles.voicemailMetaDivider}>•</Text>
            <Text style={styles.voicemailMetaText}>{entry.duration}</Text>
          </View>

          <Text
            style={styles.voicemailTranscript}
            numberOfLines={expandedVoicemailId === entry.id ? 0 : 2}
          >
            {entry.transcript}
          </Text>

          <View style={styles.voicemailActionsRow}>
            <Pressable style={styles.voicemailActionChip} onPress={() => playVoicemail(entry)}>
              <Ionicons name="play" size={14} color="#30A7FF" />
              <Text style={styles.voicemailActionText}>Play</Text>
            </Pressable>
            <Pressable style={styles.voicemailActionChip} onPress={() => callBackVoicemail(entry)}>
              <Ionicons name="call-outline" size={14} color="#30A7FF" />
              <Text style={styles.voicemailActionText}>Call Back</Text>
            </Pressable>
            <View style={styles.voicemailExpandWrap}>
              <Text style={styles.voicemailExpandText}>
                {expandedVoicemailId === entry.id ? 'Show less' : 'Read more'}
              </Text>
            </View>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );

  const renderContactDetails = () => {
    if (!selectedContact) {
      return null;
    }

    const palette = getAvatarPalette(selectedContact.name);

    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailContent}>
        <View style={styles.detailHero}>
          <View style={[styles.detailAvatar, { backgroundColor: palette.background }]}>
            <Text style={[styles.detailAvatarText, { color: palette.text }]}>
              {getInitials(selectedContact.name)}
            </Text>
          </View>
          <Text style={styles.detailName}>{selectedContact.name}</Text>
          <Text style={styles.detailPhone}>{selectedContact.phone}</Text>
          {!!selectedContact.note && <Text style={styles.detailNote}>{selectedContact.note}</Text>}
        </View>

        <View style={styles.detailActions}>
          <Pressable
            style={styles.detailActionButton}
            onPress={() => placeCall(selectedContact.phone, selectedContact)}
          >
            <Ionicons name="call" size={20} color="#30A7FF" />
            <Text style={styles.detailActionText}>Call</Text>
          </Pressable>
          <Pressable style={styles.detailActionButton} onPress={() => sendMessage(selectedContact)}>
            <Ionicons name="chatbubble" size={20} color="#30A7FF" />
            <Text style={styles.detailActionText}>Message</Text>
          </Pressable>
          <Pressable
            style={styles.detailActionButton}
            onPress={() => toggleFavorite(selectedContact.id)}
          >
            <Ionicons
              name={selectedContact.favorite ? 'star' : 'star-outline'}
              size={20}
              color={selectedContact.favorite ? '#FFD45C' : '#30A7FF'}
            />
            <Text style={styles.detailActionText}>
              {selectedContact.favorite ? 'Favorited' : 'Favorite'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.detailSectionLabel}>mobile</Text>
          <Text style={styles.detailPrimaryValue}>{selectedContact.phone}</Text>
        </View>

        {!!selectedContact.note && (
          <View style={styles.detailCard}>
            <Text style={styles.detailSectionLabel}>notes</Text>
            <Text style={styles.detailSecondaryValue}>{selectedContact.note}</Text>
          </View>
        )}

        <View style={styles.detailCard}>
          <Pressable style={styles.detailListAction} onPress={editSelectedContact}>
            <Text style={styles.detailListActionText}>Edit Contact</Text>
          </Pressable>
          <View style={styles.detailDivider} />
          <Pressable style={styles.detailListAction} onPress={deleteSelectedContact}>
            <Text style={styles.detailDeleteText}>Delete Contact</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  };

  const renderActiveTab = () => {
    if (selectedContact) {
      return renderContactDetails();
    }

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
            <Pressable style={styles.circleButton} onPress={handleBackAction}>
              <Ionicons
                name={selectedContact ? 'chevron-back' : 'reorder-two-outline'}
                size={22}
                color="#FFFFFF"
              />
            </Pressable>

            <Text style={styles.title} numberOfLines={1}>
              {selectedContact ? selectedContact.name : getTabTitle(activeTab)}
            </Text>

            <Pressable
              style={styles.circleButton}
              onPress={() => (selectedContact ? editSelectedContact() : handleShowForm())}
              disabled={activeTab !== 'contacts' && !selectedContact}
            >
              <Ionicons
                name={selectedContact ? 'create-outline' : 'add'}
                size={22}
                color={activeTab === 'contacts' || selectedContact ? '#FFFFFF' : '#5A5A60'}
              />
            </Pressable>
          </View>

          <View style={styles.contentArea}>{renderActiveTab()}</View>

          {!!activityMessage && (
            <View style={styles.toast}>
              <Ionicons name="sparkles-outline" size={15} color="#8ED8FF" />
              <Text style={styles.toastText}>{activityMessage}</Text>
            </View>
          )}

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
                      <Text style={styles.badgeText}>{unreadVoicemailCount}</Text>
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
                  onPress={() => handleTabChange(tab.key)}
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
              <KeyboardAvoidingView
                style={[
                  styles.overlayKeyboardArea,
                  Platform.OS === 'android' && keyboardHeight > 0
                    ? { paddingBottom: keyboardHeight }
                    : null,
                ]}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
              >
                <Animated.View
                  style={[
                    styles.sheet,
                    {
                      transform: [{ translateY: slideAnim }],
                    },
                  ]}
                >
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                    contentContainerStyle={[
                      styles.sheetScrollContent,
                      keyboardHeight > 0 && styles.sheetScrollContentKeyboardOpen,
                    ]}
                  >
                    <View style={styles.sheetHandle} />
                    <Text style={styles.sheetTitle}>
                      {formMode === 'edit' ? 'Edit Contact' : 'New Contact'}
                    </Text>

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
                      autoFocus
                      returnKeyType="next"
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
                      returnKeyType="next"
                    />

                    <TextInput
                      style={[styles.input, styles.noteInput]}
                      placeholder="Notes"
                      placeholderTextColor="#8A8A8F"
                      value={newContact.note}
                      onChangeText={(text) =>
                        setNewContact((current) => ({
                          ...current,
                          note: text,
                        }))
                      }
                      multiline
                      textAlignVertical="top"
                    />

                    <View style={styles.sheetActions}>
                      <Pressable style={styles.secondaryAction} onPress={handleHideForm}>
                        <Text style={styles.secondaryActionText}>Cancel</Text>
                      </Pressable>
                      <Pressable style={styles.primaryAction} onPress={saveContact}>
                        <Text style={styles.primaryActionText}>
                          {formMode === 'edit' ? 'Update' : 'Save'}
                        </Text>
                      </Pressable>
                    </View>
                  </ScrollView>
                </Animated.View>
              </KeyboardAvoidingView>
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 14,
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
  summaryRow: {
    paddingRight: 6,
    marginBottom: 14,
  },
  summaryCard: {
    width: 132,
    backgroundColor: '#141416',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#232327',
  },
  summaryLabel: {
    color: '#8C8C92',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 6,
  },
  summaryHint: {
    color: '#9B9BA1',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  spotlightCard: {
    backgroundColor: '#11232D',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#214657',
  },
  spotlightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  spotlightEyebrow: {
    color: '#79CFFF',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  spotlightTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  spotlightTime: {
    color: '#B2DFF8',
    fontSize: 13,
    marginLeft: 12,
  },
  spotlightCopy: {
    color: '#D4EEFF',
    fontSize: 14,
    marginTop: 8,
  },
  spotlightActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
  spotlightButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8ED8FF',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
  },
  spotlightButtonPrimaryText: {
    color: '#041119',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  spotlightButtonSecondary: {
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  spotlightButtonSecondaryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 17,
    marginLeft: 8,
    marginRight: 8,
  },
  filterRow: {
    paddingBottom: 12,
    paddingRight: 6,
  },
  filterChip: {
    backgroundColor: '#17181B',
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 9,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#26292D',
  },
  filterChipActive: {
    backgroundColor: '#30A7FF',
    borderColor: '#30A7FF',
  },
  filterChipText: {
    color: '#D6D6DB',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#06131B',
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
  contactQuickActions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  contactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151D22',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  contactChipText: {
    color: '#8ED8FF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
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
  favoriteActions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  smallActionChip: {
    backgroundColor: '#1D1D20',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  smallActionChipText: {
    color: '#E9E9EE',
    fontSize: 12,
    fontWeight: '600',
  },
  recentCard: {
    backgroundColor: '#141416',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#232327',
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  recentActions: {
    flexDirection: 'row',
    marginTop: 14,
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
  keypadHint: {
    color: '#8C8C92',
    fontSize: 14,
    marginTop: -16,
    marginBottom: 24,
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
  keypadSubLabel: {
    color: '#8C8C92',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginTop: 4,
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
  detailContent: {
    paddingBottom: 110,
  },
  detailHero: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 28,
  },
  detailAvatar: {
    width: 98,
    height: 98,
    borderRadius: 49,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  detailAvatarText: {
    fontSize: 34,
    fontWeight: '700',
  },
  detailName: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
  },
  detailPhone: {
    color: '#B8B8BF',
    fontSize: 16,
    marginTop: 8,
  },
  detailNote: {
    color: '#8C8C92',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 10,
    paddingHorizontal: 24,
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  detailActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#141416',
    borderRadius: 18,
    paddingVertical: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#232327',
  },
  detailActionText: {
    color: '#E7E7ED',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  detailCard: {
    backgroundColor: '#141416',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#232327',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
  },
  detailSectionLabel: {
    color: '#8C8C92',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  detailPrimaryValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  detailSecondaryValue: {
    color: '#E7E7ED',
    fontSize: 15,
    lineHeight: 22,
  },
  detailListAction: {
    paddingVertical: 6,
  },
  detailListActionText: {
    color: '#30A7FF',
    fontSize: 17,
    fontWeight: '600',
  },
  detailDeleteText: {
    color: '#FF6B6B',
    fontSize: 17,
    fontWeight: '600',
  },
  detailDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#202022',
    marginVertical: 12,
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
  voicemailContent: {
    paddingBottom: 110,
  },
  voicemailSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141416',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#232327',
  },
  voicemailSummaryLabel: {
    color: '#8C8C92',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  voicemailSummaryValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  voicemailRow: {
    backgroundColor: '#141416',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#232327',
  },
  voicemailRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voicemailNameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  voicemailUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#30A7FF',
    marginRight: 8,
  },
  voicemailName: {
    color: '#E5E5EA',
    fontSize: 17,
    fontWeight: '600',
  },
  voicemailNameUnread: {
    color: '#FFFFFF',
  },
  voicemailTime: {
    color: '#8C8C92',
    fontSize: 13,
  },
  voicemailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  voicemailMetaText: {
    color: '#8C8C92',
    fontSize: 13,
  },
  voicemailMetaDivider: {
    color: '#5F5F66',
    fontSize: 13,
    marginHorizontal: 6,
  },
  voicemailTranscript: {
    color: '#C8C8CE',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  voicemailActionsRow: {
    flexDirection: 'row',
    marginTop: 14,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  voicemailActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D1D20',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
  },
  voicemailActionText: {
    color: '#30A7FF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  voicemailExpandWrap: {
    paddingVertical: 8,
  },
  voicemailExpandText: {
    color: '#8C8C92',
    fontSize: 12,
    fontWeight: '600',
  },
  toast: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 88,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F202B',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#214657',
  },
  toastText: {
    color: '#DDF4FF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
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
  overlayKeyboardArea: {
    flex: 1,
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
    maxHeight: '88%',
  },
  sheetScrollContent: {
    paddingBottom: 12,
  },
  sheetScrollContentKeyboardOpen: {
    paddingBottom: 36,
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
  noteInput: {
    minHeight: 96,
    textAlignVertical: 'top',
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
