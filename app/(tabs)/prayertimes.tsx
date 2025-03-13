"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from "react-native"
import { DataTable, Card, Badge, Appbar, Menu, IconButton } from "react-native-paper"
import axios from "axios"
import moment from "moment"
import { MaterialCommunityIcons } from "@expo/vector-icons"

const cities = [
  { id: "dublin", name: "Dublin", country: "Ireland" },
  { id: "london", name: "London", country: "United Kingdom" },
  { id: "newyork", name: "New York", country: "United States" },
  { id: "dubai", name: "Dubai", country: "United Arab Emirates" },
]

const PrayerTimesTable = () => {
  const [prayerTimes, setPrayerTimes] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState("")
  const [nextPrayer, setNextPrayer] = useState({ name: "", time: "" })
  const [selectedCity, setSelectedCity] = useState(cities[0])
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)
  const [currentTime, setCurrentTime] = useState(moment().format("h:mm A"))
  const [currentDate, setCurrentDate] = useState(moment().format("dddd, MMMM D, YYYY"))

  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        setLoading(true)
        const response = await axios.get("http://api.aladhan.com/v1/timingsByCity", {
          params: {
            city: selectedCity.name,
            country: selectedCity.country,
            method: 2,
          },
        })

        const timings = response.data.data.timings
        const formattedTimes = [
          { name: "Fajr", time: timings.Fajr },
          { name: "Sunrise", time: timings.Sunrise },
          { name: "Dhuhr", time: timings.Dhuhr },
          { name: "Asr", time: timings.Asr },
          { name: "Maghrib", time: timings.Maghrib },
          { name: "Isha", time: timings.Isha },
        ]

        setPrayerTimes(formattedTimes)
      } catch (error) {
        console.error("Error fetching prayer times:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrayerTimes()
  }, [selectedCity])

  useEffect(() => {
    // Update current time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(moment().format("h:mm A"))
      setCurrentDate(moment().format("dddd, MMMM D, YYYY"))
    }, 1000)

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      if (prayerTimes.length > 0) {
        updateCountdown(prayerTimes)
      }
    }, 1000)

    return () => {
      clearInterval(timeInterval)
      clearInterval(countdownInterval)
    } // Cleanup on unmount
  }, [prayerTimes])

  // Function to find the next prayer and calculate countdown
  const updateCountdown = (times) => {
    const now = moment()
    let nextPrayerInfo = null

    for (const prayer of times) {
      const prayerTime = moment(prayer.time, "HH:mm")

      if (prayerTime.isAfter(now)) {
        nextPrayerInfo = prayer
        break
      }
    }

    if (!nextPrayerInfo) {
      nextPrayerInfo = times[0] // If no upcoming prayer, reset to first prayer of next day
    }

    const nextPrayerTime = moment(nextPrayerInfo.time, "HH:mm")
    if (!nextPrayerInfo) return

    // If it's for tomorrow, add 24 hours
    if (nextPrayerTime.isBefore(now)) {
      nextPrayerTime.add(1, "days")
    }

    const duration = moment.duration(nextPrayerTime.diff(now))
    const hours = Math.floor(duration.asHours())
    const minutes = duration.minutes()
    const seconds = duration.seconds()

    setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
    setNextPrayer({
      name: nextPrayerInfo.name,
      time: nextPrayerInfo.time,
    })
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  const theme = isDarkMode ? darkTheme : lightTheme

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.headerBackground }}>
        <Appbar.Content title="Prayer Times" titleStyle={{ color: theme.headerText, fontWeight: "bold" }} />
        <IconButton
          icon={isDarkMode ? "white-balance-sunny" : "moon-waning-crescent"}
          color={theme.headerText}
          size={24}
          onPress={toggleDarkMode}
        />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<Appbar.Action icon="map-marker" color={theme.headerText} onPress={() => setMenuVisible(true)} />}
        >
          {cities.map((city) => (
            <Menu.Item
              key={city.id}
              onPress={() => {
                setSelectedCity(city)
                setMenuVisible(false)
              }}
              title={`${city.name}, ${city.country}`}
            />
          ))}
        </Menu>
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={styles.loader} />
        ) : (
          <>
            <Card style={[styles.nextPrayerCard, { backgroundColor: theme.cardBackground }]}>
              <Card.Content style={styles.nextPrayerContent}>
                <Text style={[styles.nextPrayerLabel, { color: theme.textSecondary }]}>Next Prayer</Text>
                <Text style={[styles.nextPrayerName, { color: theme.primary }]}>{nextPrayer.name}</Text>
                <View style={styles.timeRow}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={theme.textSecondary} />
                  <Text style={[styles.nextPrayerTime, { color: theme.text }]}>{nextPrayer.time}</Text>
                </View>
                <Badge style={[styles.countdownBadge, { borderColor: theme.primary }]}>
                  <Text style={[styles.countdownText, { color: theme.primary }]}>{timeRemaining} remaining</Text>
                </Badge>
              </Card.Content>
            </Card>

            <DataTable style={[styles.table, { backgroundColor: theme.cardBackground }]}>
              <DataTable.Header style={[styles.tableHeader, { backgroundColor: theme.tableHeaderBackground }]}>
                <DataTable.Title textStyle={[styles.headerText, { color: theme.tableHeaderText }]}>
                  Prayer
                </DataTable.Title>
                <DataTable.Title textStyle={[styles.headerText, { color: theme.tableHeaderText }]}>
                  Time
                </DataTable.Title>
                <DataTable.Title textStyle={[styles.headerText, { color: theme.tableHeaderText }]} right>
                  Status
                </DataTable.Title>
              </DataTable.Header>

              {prayerTimes.map((prayer, index) => {
                const isNextPrayer = prayer.name === nextPrayer.name
                return (
                  <DataTable.Row
                    key={index}
                    style={[
                      styles.tableRow,
                      { backgroundColor: isNextPrayer ? theme.highlightBackground : theme.cardBackground },
                    ]}
                  >
                    <DataTable.Cell>
                      <View style={styles.prayerNameCell}>
                        <View
                          style={[
                            styles.indicator,
                            { backgroundColor: isNextPrayer ? theme.primary : theme.textSecondary },
                          ]}
                        />
                        <Text style={[styles.prayerName, { color: theme.text }]}>{prayer.name}</Text>
                      </View>
                    </DataTable.Cell>
                    <DataTable.Cell>
                      <Text style={[styles.prayerTime, { color: theme.text }]}>{prayer.time}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell right>
                      {isNextPrayer && <Badge style={styles.nextBadge}>Next</Badge>}
                    </DataTable.Cell>
                  </DataTable.Row>
                )
              })}
            </DataTable>

            <View style={styles.footer}>
              <View style={styles.currentTimeContainer}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={theme.textSecondary} />
                <Text style={[styles.currentTime, { color: theme.textSecondary }]}>{currentTime}</Text>
              </View>
              <Text style={[styles.currentDate, { color: theme.textSecondary }]}>{currentDate}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const lightTheme = {
  background: "#f5f5f5",
  cardBackground: "#ffffff",
  headerBackground: "#ffffff",
  tableHeaderBackground: "#f0f0f0",
  highlightBackground: "rgba(76, 175, 80, 0.1)",
  text: "#333333",
  textSecondary: "#666666",
  tableHeaderText: "#333333",
  headerText: "#333333",
  primary: "#4CAF50",
  border: "#e0e0e0",
}

const darkTheme = {
  background: "#121212",
  cardBackground: "#1e1e1e",
  headerBackground: "#1e1e1e",
  tableHeaderBackground: "#2c2c2c",
  highlightBackground: "rgba(76, 175, 80, 0.15)",
  text: "#e0e0e0",
  textSecondary: "#a0a0a0",
  tableHeaderText: "#e0e0e0",
  headerText: "#e0e0e0",
  primary: "#81c784",
  border: "#333333",
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loader: {
    marginTop: 50,
  },
  nextPrayerCard: {
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  nextPrayerContent: {
    alignItems: "center",
    padding: 16,
  },
  nextPrayerLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  nextPrayerName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  nextPrayerTime: {
    fontSize: 18,
  },
  countdownBadge: {
    backgroundColor: "transparent",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  countdownText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  table: {
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
    marginBottom: 16,
  },
  tableHeader: {
    height: 48,
  },
  headerText: {
    fontWeight: "bold",
  },
  tableRow: {
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  prayerNameCell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  prayerName: {
    fontWeight: "500",
  },
  prayerTime: {
    fontSize: 14,
  },
  nextBadge: {
    backgroundColor: "transparent",
    color: "#4CAF50",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  footer: {
    alignItems: "center",
    marginTop: 16,
  },
  currentTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  currentTime: {
    fontSize: 14,
  },
  currentDate: {
    fontSize: 12,
  },
})

export default PrayerTimesTable




// import { Text, StyleSheet } from 'react-native';

// import React from "react";
// import { View } from "react-native";
// import { DataTable } from "react-native-paper";


// export default function PrayerTimes() {
//     const prayerTimes = [
//         { name: "Fajr", time: "05:30 AM" },
//         { name: "Dhuhr", time: "12:45 PM" },
//         { name: "Asr", time: "04:15 PM" },
//         { name: "Maghrib", time: "06:30 PM" },
//         { name: "Isha", time: "08:00 PM" },
//       ];
//       return (
//         <View style={styles.container}>
//           <DataTable>
//             <DataTable.Header>
//               <DataTable.Title textStyle={{ color: "white", fontSize: 16, fontWeight: "bold" }}>Prayer</DataTable.Title>
//               <DataTable.Title textStyle={{ color: "white", fontSize: 16, fontWeight: "bold" }}>Time</DataTable.Title>
//             </DataTable.Header>
    
//             {prayerTimes.map((prayer, index) => (
//               <DataTable.Row key={index}>
//                 <DataTable.Cell textStyle={{ color: "white", fontSize: 16, fontWeight: "bold" }}>{prayer.name}</DataTable.Cell>
//                 <DataTable.Cell textStyle={{ color: "white", fontSize: 16, fontWeight: "bold" }}>{prayer.time}</DataTable.Cell>
//               </DataTable.Row>
//             ))}
//           </DataTable>
//         </View>
//       );
// }

// const styles = StyleSheet.create({
//     container: {
//       flex: 1,
//       backgroundColor: '#25292e',
//       justifyContent: 'center',
//       alignItems: 'center',
//     },
//     text: {
//       color: '#fff',
//     }
//   });