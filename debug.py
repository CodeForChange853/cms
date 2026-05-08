import os

print("Current Working Directory:", os.getcwd())

if os.path.exists('templates'):
    print("✅ 'templates' folder found.")
    files = os.listdir('templates')
    print("📂 Files inside 'templates':")
    for f in files:
        print(f" - {f}")
        
    if 'submit_complaint.html' in files:
        print("✅ submit_complaint.html is definitely there!")
    else:
        print("❌ submit_complaint.html is NOT in the list. Check spelling/extension.")
else:
    print("❌ 'templates' folder NOT found. Are you running this from the right folder?")