// src/scripts/seedQuestions.mjs
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const adminDb = getFirestore();

async function seedQuestions() {
  const questions = [
    {
      translations: {
        en: {
          question: "What is the capital of Morocco?",
          options: ["Rabat", "Casablanca", "Marrakech", "Fes"],
          correctAnswer: "Rabat"
        },
        ar: {
          question: "ما هي عاصمة المغرب؟",
          options: ["الرباط", "الدار البيضاء", "مراكش", "فاس"],
          correctAnswer: "الرباط"
        },
        fr: {
          question: "Quelle est la capitale du Maroc ?",
          options: ["Rabat", "Casablanca", "Marrakech", "Fès"],
          correctAnswer: "Rabat"
        }
      }
    },
    {
      translations: {
        en: {
          question: "Which ocean borders Morocco?",
          options: ["Mediterranean Sea", "Atlantic Ocean", "Both Atlantic and Mediterranean", "Red Sea"],
          correctAnswer: "Both Atlantic and Mediterranean"
        },
        ar: {
          question: "أي محيط يحد المغرب؟",
          options: ["البحر المتوسط", "المحيط الأطلسي", "كلاهما الأطلسي والمتوسط", "البحر الأحمر"],
          correctAnswer: "كلاهما الأطلسي والمتوسط"
        },
        fr: {
          question: "Quel océan borde le Maroc ?",
          options: ["Mer Méditerranée", "Océan Atlantique", "Les deux Atlantique et Méditerranée", "Mer Rouge"],
          correctAnswer: "Les deux Atlantique et Méditerranée"
        }
      }
    },
    {
      translations: {
        en: {
          question: "What is the largest city in Morocco?",
          options: ["Rabat", "Casablanca", "Marrakech", "Fes"],
          correctAnswer: "Casablanca"
        },
        ar: {
          question: "ما هي أكبر مدينة في المغرب؟",
          options: ["الرباط", "الدار البيضاء", "مراكش", "فاس"],
          correctAnswer: "الدار البيضاء"
        },
        fr: {
          question: "Quelle est la plus grande ville du Maroc ?",
          options: ["Rabat", "Casablanca", "Marrakech", "Fès"],
          correctAnswer: "Casablanca"
        }
      }
    },
    {
      translations: {
        en: {
          question: "Which mountain range runs through Morocco?",
          options: ["Atlas Mountains", "Himalayas", "Alps", "Andes"],
          correctAnswer: "Atlas Mountains"
        },
        ar: {
          question: "أي سلسلة جبال تمر عبر المغرب؟",
          options: ["جبال الأطلس", "جبال الهيمالايا", "جبال الألب", "جبال الأنديز"],
          correctAnswer: "جبال الأطلس"
        },
        fr: {
          question: "Quelle chaîne de montagnes traverse le Maroc ?",
          options: ["Montagnes de l'Atlas", "Himalaya", "Alpes", "Andes"],
          correctAnswer: "Montagnes de l'Atlas"
        }
      }
    },
    {
      translations: {
        en: {
          question: "What is the official language of Morocco?",
          options: ["French", "Arabic", "Berber", "Spanish"],
          correctAnswer: "Arabic"
        },
        ar: {
          question: "ما هي اللغة الرسمية للمغرب؟",
          options: ["الفرنسية", "العربية", "الأمازيغية", "الإسبانية"],
          correctAnswer: "العربية"
        },
        fr: {
          question: "Quelle est la langue officielle du Maroc ?",
          options: ["Français", "Arabe", "Berbère", "Espagnol"],
          correctAnswer: "Arabe"
        }
      }
    },
    {
      translations: {
        en: {
          question: "What is the currency of Morocco?",
          options: ["Euro", "Dirham", "Dollar", "Pound"],
          correctAnswer: "Dirham"
        },
        ar: {
          question: "ما هي عملة المغرب؟",
          options: ["اليورو", "الدرهم", "الدولار", "الجنيه"],
          correctAnswer: "الدرهم"
        },
        fr: {
          question: "Quelle est la monnaie du Maroc ?",
          options: ["Euro", "Dirham", "Dollar", "Livre"],
          correctAnswer: "Dirham"
        }
      }
    },
    {
      translations: {
        en: {
          question: "Which strait separates Morocco from Spain?",
          options: ["Strait of Gibraltar", "Bosphorus", "English Channel", "Strait of Hormuz"],
          correctAnswer: "Strait of Gibraltar"
        },
        ar: {
          question: "أي مضيق يفصل المغرب عن إسبانيا؟",
          options: ["مضيق جبل طارق", "البوسفور", "القناة الإنجليزية", "مضيق هرمز"],
          correctAnswer: "مضيق جبل طارق"
        },
        fr: {
          question: "Quel détroit sépare le Maroc de l'Espagne ?",
          options: ["Détroit de Gibraltar", "Bosphore", "Manche", "Détroit d'Hormuz"],
          correctAnswer: "Détroit de Gibraltar"
        }
      }
    },
    {
      translations: {
        en: {
          question: "What is the famous red city of Morocco?",
          options: ["Casablanca", "Rabat", "Marrakech", "Fes"],
          correctAnswer: "Marrakech"
        },
        ar: {
          question: "ما هي المدينة الحمراء الشهيرة في المغرب؟",
          options: ["الدار البيضاء", "الرباط", "مراكش", "فاس"],
          correctAnswer: "مراكش"
        },
        fr: {
          question: "Quelle est la célèbre ville rouge du Maroc ?",
          options: ["Casablanca", "Rabat", "Marrakech", "Fès"],
          correctAnswer: "Marrakech"
        }
      }
    },
    {
      translations: {
        en: {
          question: "Which desert is located in Morocco?",
          options: ["Sahara Desert", "Gobi Desert", "Kalahari Desert", "Atacama Desert"],
          correctAnswer: "Sahara Desert"
        },
        ar: {
          question: "أي صحراء تقع في المغرب؟",
          options: ["الصحراء الكبرى", "صحراء جوبي", "صحراء كالاهاري", "صحراء أتاكاما"],
          correctAnswer: "الصحراء الكبرى"
        },
        fr: {
          question: "Quel désert se trouve au Maroc ?",
          options: ["Désert du Sahara", "Désert de Gobi", "Désert du Kalahari", "Désert d'Atacama"],
          correctAnswer: "Désert du Sahara"
        }
      }
    },
    {
      translations: {
        en: {
          question: "What is the traditional Moroccan tea?",
          options: ["Black tea", "Green tea with mint", "Chamomile tea", "Oolong tea"],
          correctAnswer: "Green tea with mint"
        },
        ar: {
          question: "ما هو الشاي المغربي التقليدي؟",
          options: ["الشاي الأسود", "الشاي الأخضر بالنعناع", "شاي البابونج", "شاي الأولونغ"],
          correctAnswer: "الشاي الأخضر بالنعناع"
        },
        fr: {
          question: "Quel est le thé traditionnel marocain ?",
          options: ["Thé noir", "Thé vert à la menthe", "Thé à la camomille", "Thé Oolong"],
          correctAnswer: "Thé vert à la menthe"
        }
      }
    }
  ];

  try {
    console.log('Starting to seed questions...');
    
    // Clear existing questions (optional)
    const existingQuestions = await adminDb.collection('questions').get();
    console.log(`Found ${existingQuestions.size} existing questions`);
    
    // Add new questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await adminDb.collection('questions').add(q);
      console.log(`Added question ${i + 1}/${questions.length}: ${q.translations.en.question}`);
    }
    
    console.log('✅ Questions seeded successfully!');
    console.log(`Total questions added: ${questions.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding questions:', error);
  } finally {
    // Exit the process
    process.exit(0);
  }
}

// Run the seeding function
seedQuestions();