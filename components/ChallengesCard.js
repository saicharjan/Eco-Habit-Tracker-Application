import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ChallengeItem = ({ challenge, completed, onToggle }) => {
  return (
    <TouchableOpacity style={styles.challengeItem} onPress={onToggle}>
      <Ionicons 
        name={completed ? "checkbox" : "square-outline"} 
        size={20} 
        color={completed ? "#4CAF50" : "#757575"}
        style={styles.checkboxIcon}
      />
      <Text style={[
        styles.challengeText,
        completed && styles.completedChallengeText
      ]}>
        {challenge}
      </Text>
    </TouchableOpacity>
  );
};

const ChallengesCard = ({ title, challenges = [], onToggleChallenge, onAddChallenge }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      
      <FlatList
        data={challenges}
        keyExtractor={(item, index) => item.id || index.toString()}
        renderItem={({ item }) => (
          <ChallengeItem 
            challenge={item.text} 
            completed={item.completed} 
            onToggle={() => onToggleChallenge && onToggleChallenge(item.id)}
          />
        )}
        scrollEnabled={false}
      />
      
      {onAddChallenge && (
        <TouchableOpacity style={styles.addButton} onPress={onAddChallenge}>
          <Ionicons name="add-circle-outline" size={20} color="#4CAF50" />
          <Text style={styles.addButtonText}>Add Challenge</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  challengeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxIcon: {
    marginRight: 10,
  },
  challengeText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  completedChallengeText: {
    textDecorationLine: 'line-through',
    color: '#888888',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    marginLeft: 8,
  }
});

export default ChallengesCard; 