// ============================================
// SMART CONTEXT FILTER - Optimerar för OpenAI
// ============================================

const email = $input.first().json;
const userMessage = email.body || '';

console.log('🚀 START Smart Context Filter');

// ============================================
// 1. INTELLIGENT FAQ FILTERING
// ============================================

const filterRelevantFAQ = (faqList, userMessage, maxItems = 5) => {
  if (!faqList || faqList.length === 0) return [];
  
  const keywords = userMessage.toLowerCase().match(/\b\w{3,}\b/g) || [];
  
  const scoredFAQ = faqList.map(faq => {
    let score = 0;
    const question = (faq.question || faq.Question || '').toLowerCase();
    const answer = (faq.answer || faq.Answer || '').toLowerCase();
    
    keywords.forEach(keyword => {
      if (question.includes(keyword)) score += 2;
      if (answer.includes(keyword)) score += 1;
    });
    
    return { ...faq, score };
  });
  
  return scoredFAQ
    .filter(f => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems)
    .map(({ score, ...faq }) => faq);
};

// ============================================
// 2. INTELLIGENT PRODUCT FILTERING
// ============================================

const filterRelevantProducts = (products, userMessage, maxItems = 5) => {
  if (!products || products.length === 0) return [];
  
  const keywords = userMessage.toLowerCase();
  
  const scoredProducts = products.map(p => {
    let score = 0;
    const name = (p.name || '').toLowerCase();
    const category = (p.category || '').toLowerCase();
    
    if (name.includes('grillstation') && keywords.includes('grill')) score += 3;
    if (name.includes('tält') && keywords.includes('tält')) score += 3;
    if (name.includes('bord') && keywords.includes('bord')) score += 3;
    if (name.includes('stol') && keywords.includes('stol')) score += 3;
    if (name.includes('värmepump') && keywords.includes('värme')) score += 3;
    if ((name.includes('led') || name.includes('lysrör')) && (keywords.includes('ljus') || keywords.includes('belysning'))) score += 3;
    if (name.includes('golv') && keywords.includes('golv')) score += 3;
    
    if (keywords.includes(name)) score += 2;
    if (keywords.includes(category)) score += 1;
    
    return { ...p, score };
  });
  
  return scoredProducts
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems)
    .map(({ score, ...p }) => p);
};

// ============================================
// 3. TRIMMA KONVERSATIONSHISTORIA
// ============================================

const trimHistory = (history, maxMessages = 3) => {
  if (!history || history.length === 0) return [];
  
  return history
    .slice(-maxMessages)
    .map(h => ({
      sender_type: h.sender_type,
      body_plain: h.body_plain || h.body || '',
      created_at: h.created_at
    }));
};

// ============================================
// 4. BYGG OPTIMERAD KONVERSATIONSHISTORIA
// ============================================

const buildOptimizedHistory = (trimmedHistory) => {
  return trimmedHistory
    .map(msg => {
      const sender = msg.sender_type === 'customer' ? 'Kund' : 'Vi';
      return sender + ': ' + msg.body_plain;
    })
    .join('\n\n---\n\n');
};

// ============================================
// 5. MAIN FILTERING LOGIC
// ============================================

try {
  const faqList = email.faqList || [];
  const productList = email.priceList || [];
  const history = email.history || [];
  
  console.log('📊 BEFORE: FAQ=' + faqList.length + ', Products=' + productList.length + ', History=' + history.length);
  
  const relevantFAQ = filterRelevantFAQ(faqList, userMessage, 5);
  const relevantProducts = filterRelevantProducts(productList, userMessage, 5);
  const trimmedHistory = trimHistory(history, 3);
  const optimizedHistory = buildOptimizedHistory(trimmedHistory);
  
  console.log('✅ AFTER: FAQ=' + relevantFAQ.length + ', Products=' + relevantProducts.length + ', History=' + trimmedHistory.length);
  
  const optimizedData = {
    ...email,
    faqList: relevantFAQ,
    priceList: relevantProducts,
    history: trimmedHistory,
    conversationHistory: optimizedHistory
  };
  
  return [{
    json: optimizedData
  }];
  
} catch (error) {
  console.error('ERROR: ' + error.message);
  
  return [{
    json: {
      ...email,
      faqList: (email.faqList || []).slice(0, 5),
      priceList: (email.priceList || []).slice(0, 5),
      history: (email.history || []).slice(-3)
    }
  }];
}
