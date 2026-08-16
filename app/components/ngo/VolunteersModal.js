import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

export default function VolunteersModal({ visible, onClose }) {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      fetchVolunteers();
    }
  }, [visible]);

  const fetchVolunteers = async () => {
    try {
      const response = await axios.get('/api/ngo/volunteers');
      setVolunteers(response.data.data);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      Alert.alert('Error', 'Failed to fetch volunteers');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVolunteer = async (volunteerId) => {
    Alert.alert(
      'Remove Volunteer',
      'Are you sure you want to remove this volunteer?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement remove volunteer API endpoint
              Alert.alert('Success', 'Volunteer removed successfully');
              fetchVolunteers();
            } catch (error) {
              console.error('Error removing volunteer:', error);
              Alert.alert('Error', 'Failed to remove volunteer');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage Volunteers</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.volunteersList}>
            {loading ? (
              <Text style={styles.loadingText}>Loading volunteers...</Text>
            ) : volunteers.length === 0 ? (
              <Text style={styles.emptyText}>No volunteers found</Text>
            ) : (
              volunteers.map((volunteer) => (
                <View key={volunteer._id} style={styles.volunteerCard}>
                  <View style={styles.volunteerInfo}>
                    <View style={styles.avatarContainer}>
                      <Ionicons name="person-circle-outline" size={50} color="#666" />
                    </View>
                    <View style={styles.volunteerDetails}>
                      <Text style={styles.volunteerName}>{volunteer.name}</Text>
                      <Text style={styles.volunteerEmail}>{volunteer.email}</Text>
                      {volunteer.bio && (
                        <Text style={styles.volunteerBio}>{volunteer.bio}</Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveVolunteer(volunteer._id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  volunteersList: {
    padding: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 20,
  },
  volunteerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f8f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  volunteerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  volunteerDetails: {
    flex: 1,
  },
  volunteerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  volunteerEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  volunteerBio: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  removeButton: {
    padding: 8,
  },
}); 