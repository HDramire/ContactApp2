import { StatusBar } from 'expo-status-bar';
import React, {useState, useRef} from 'react';
// import { StyleSheet, Text, TextComponent, View } from 'react-native';
// import {Footer, FooterTab, Button, Icon} from 'native-base';
// import {TabNavigator} from 'react-navigation';
// import HomeScreen from './Components/HomeScreen/HomeScreen';
// import Favorites from './Components/Favorites/Favorites';
import { StyleSheet, View, FlatList, Text, Button, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Animated, Dimensions } from 'react-native';
// const App = TabNavigator ({
//   HomeScreen: {screen : HomeScreen},
//   Favorites: {screen : Favorites},
// }, {
//   tabBarPosition: 'bottom',
//   tabBarPosition: props => {
//     return (
//       <Footer>
//         <FooterTab>
//           <Button 
//             vertical 
//             active={props.navigationState.index === 0} 
//             onPress={() => props.navigation.navigate('HomeScreen')}
//           >
//             <Icon name= "home"/>
//             <Text>Home</Text>
//           </Button>

//           <Button 
//             vertical 
//             active={props.navigationState.index === 1} 
//             onPress={() => props.navigation.navigate('Favorites')}
//           >
//             <Icon name= "heart"/>
//             <Text>Favorites</Text>
//           </Button>
//         </FooterTab>
//       </Footer>
//     )
//   },
// })

// State to show/hide 
export default function App () {
  const [contacts, setContacts] = useState([
    {id: '1', name: 'Henry Ramirez Jr', phone: '239-784-1766'},
    {id: '2', name: 'Henry Ramirez', phone: '239-784-5517'},
    {id: '3', name: 'Esmir Ramirez', phone: '239-784-3412'},
    {id: '4', name: 'Sofia Ramirez', phone: '239-577-1542'},
  ]);
  const [showAddContact, setShowAddContact] = useState(false); 
  const [newContact, setNewContact] = useState({name: '', phone: ''});

  // Animated Value for Slide-Up Effect
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current; 

  // Function to Slide Up
  const handleShowForm = () => {
    setShowAddContact(true);
    Animated.timing(slideAnim, {
      toValue: 0, // Moves to top
      duration: 500, // Animation time (0.5 seconds)
      useNativeDriver: true,
    }).start();
  };

  // Function to Slide Down & Close
  const handleHideForm = () => {
    Animated.timing(slideAnim, {
      toValue: Dimensions.get('window').height, // Moves back down
      duration: 500,
      useNativeDriver: true,
    }).start(() => setShowAddContact(false)); // Hides after animation
  };
  
  const addContact = () =>{
    if (newContact.name && /^[0-9\s\-()]*$/.test(newContact.phone)){
      setContacts([...contacts, {id: Date.now().toString(), ...newContact}]);
      setNewContact({name:'', phone:''});
      handleHideForm(); // Slide dow after adding
    } else {
      alert('Please enter a valid phone number.');
    }
  };

  const renderContact = ({item}) => (
    <TouchableOpacity style={styles.contactCard}>
      <Text style={styles.contactName}>{item.name}</Text>
      <Text style={styles.contactPhone}>{item.phone}</Text>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <Text style={styles.title}>Contacts</Text>
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          style={styles.contactList}
        />
        {!showAddContact && (
          <TouchableOpacity
            style={styles.addContactButton}
            onPress={handleShowForm}
          >
            <Text style={styles.addContactButtonText}>Add Contact</Text>
          </TouchableOpacity>
        )}

        {showAddContact && (
          <Animated.View style={[styles.addContactForm, {transform: [{translateY: slideAnim}] }]}>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={newContact.name}
              onChangeText={(text) => 
                setNewContact({...newContact, name: text})
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              value={newContact.phone}
              onChangeText={(text) => {
                //Allow only digits, dashes, spaces, and parentheses
                const phoneRegex = /^[0-9\s\-()]*$/;
                if (phoneRegex.test(text)) {
                  setNewContact({...newContact, phone: text});
                }
              }}
              keyboardType="phone-pad"
            />
            <View style={styles.buttonContainer}>
              <Button 
                title="Save" 
                onPress={addContact}
                style={styles.buttonStyle}
                />
              <Button 
                title="Cancel" 
                color="red" 
                onPress={handleHideForm}
                style={styles.buttonStyle}
                />
            </View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 40,
    textAlign: 'left',
    paddingHorizontalL: 10,
  },
  contactLis: {
    flex: 1,
    marginBottom: 20
  },
  contactCard: {
    backgroundColor: '#fff', 
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 3,
  },
  contactName: {
    fontSize: 10,
    fontWeight: 'center',
  },
  contactPhone: {
    fontSize: 18,
    color: '#666',
  },
  addContactForm: {
    position: 'absolute',
    top: '30%', // Adjust this value to center it
    left: '10%',
    width: '90%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  
  input: {
    borderBottomWidth: 3,
    borderBottomColor: '#ccc',
    marginBottom: 15,
    fontSize: 16,
    padding: 5,
    borderWidth: 1,
    borderRadius: 5,
  },
  buttonContainer: {
    flexDirection: 'row', // Places buttons side by side
    justifyContent: 'space-between',
    marginTop: 10,
  },
  buttonStyle: {
    borderRadius: 8,
  },
  addContactButton: {
    backgroundColor: '#007BFF', // Blue button
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25, // Makes the button rounded
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  addContactButtonText: {
    color: '#fff', // White text
    fontSize: 16,
    fontWeight: 'bold',
  },
});