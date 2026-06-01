# Smart Campus Information System - Mini Project
import os
students = []
# 1. Student Registration and Grade Evaluation
def register_student():
name = input("Enter Student Name: ")
marks = int(input("Enter Marks: "))
if marks >= 90:
grade = "A"
elif marks >= 75:
grade = "B"
elif marks >= 60:
grade = "C"
elif marks >= 40:
grade = "D"
else:
grade = "F"
students.append({"name": name,
"marks": marks,
"grade": grade})
print("Student Registered Successfully!")
print("Grade:"
, grade)
# 2. Course Enrollment
def course_enrollment():
courses = []
for i in range(5):
course = input("Enter Course Name (or done): ")
if course.lower() == "done":
break
courses.append(course)
print("Enrolled Courses:"
, courses)
# 3. Student Record Management
def display_records():
print("\nStudent Records")
for s in students:
print(s)
# 4. Sorting and Searching
def search_sort():
ids = [105, 102, 110, 108, 101]
ids.sort()
print("Sorted IDs:"
, ids)
key = int(input("Enter ID to Search: "))
if key in ids:
print("ID Found")
else:
print("ID Not Found")
# 5. Fee Calculation
def fee_calculation():
 tuition = int(input("Tuition Fee: "))
 hostel = int(input("Hostel Fee: "))
 transport = int(input("Transport Fee: "))
 total = tuition + hostel + transport
 print("Total Fee =", total)
# 6. File Handling
def file_handling():
 file = open("records.txt", "w")
 for s in students:
 file.write(f"{s['name']} {s['marks']} {s['grade']}\n")
 file.close()
 print("Records Saved Successfully")
 file = open("records.txt", "r")
 print("\nStored Records:")
 print(file.read())
 file.close()
# 7. Directory Scanning
def directory_scan():
 path = input("Enter Directory Path: ")
 try:
 files = os.listdir(path)
 print("Files and Folders:")
 for f in files:
 print(f)
 except FileNotFoundError:
 print("Invalid Directory Path")
# 8. Performance Analytics
def analytics():
 marks = [85, 92, 76, 89]
 average = sum(marks) / len(marks)
 print("Average Marks =", average)
 print("Highest Marks =", max(marks))
 print("Lowest Marks =", min(marks))
  # Main Menu
while True:
 print("\nSMART CAMPUS INFORMATION SYSTEM")
 print("1. Student Registration")
 print("2. Course Enrollment")
 print("3. Student Records")
 print("4. Search and Sort")
 print("5. Fee Calculation")
 print("6. File Handling")
 print("7. Directory Scan")
 print("8. Performance Analytics")
 print("9. Exit")
 choice = input("Enter Choice: ")
 if choice == "1":
 register_student()
 elif choice == "2":
 course_enrollment()
 elif choice == "3":
 display_records()
 elif choice == "4":
 search_sort()
 elif choice == "5":
 fee_calculation()
 elif choice == "6":
 file_handling()
 elif choice == "7":
 directory_scan()
 elif choice == "8":
 analytics()
 elif choice == "9":
 print("Thank You")
 break
 else:
 print("Invalid Choice")
