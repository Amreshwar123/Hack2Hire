const express = require('express');
const cors = require('cors'); // Essential to talk to your index.html file
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors()); // Enable cross-origin requests for your browser dashboard

// POST /evaluate-interview endpoint
app.post('/evaluate-interview', (req, res) => {
  try {
    const interviewLog = req.body;
    
    // 1. Validate that payload exists
    if (!interviewLog || !interviewLog.questions || interviewLog.questions.length === 0) {
      return res.status(400).json({
        error: 'Invalid payload: Array of questions inside interview log is required.'
      });
    }
    
    const questions = interviewLog.questions;
    
    // 2. Initialize State Machine Variables
    let currentDifficulty = 'Easy';
    let cumulativeScore = 0;
    let totalQuestionsProcessed = 0;
    let isTerminated = false;
    let terminationReason = 'COMPLETED_SUCCESSFULLY';

    // Skill aggregators
    let skillsScores = { accuracy: 0, clarity: 0, depth: 0, relevance: 0 };
    let strengths = [];
    let weaknesses = [];

    // 3. Process the state log step-by-step (Simulating the interview tracking)
    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        totalQuestionsProcessed++;

        // Calculate baseline parameters score for this specific step
        let questionBaseScore = (q.accuracy + q.clarity + q.depth + q.relevance) / 4;

        // Apply Time Constraint Penalty (20% reduction if candidate went overtime)
        let timeTaken = q.timeTaken || 0;
        let timeAllowed = q.timeAllowed || 60;
        if (timeTaken > timeAllowed) {
            questionBaseScore = questionBaseScore * 0.80; 
        }

        // Aggregate individual attribute arrays
        skillsScores.accuracy += q.accuracy;
        skillsScores.clarity += q.clarity;
        skillsScores.depth += q.depth;
        skillsScores.relevance += q.relevance;

        // Update overall running average state
        cumulativeScore += questionBaseScore;
        let currentRunningAverage = cumulativeScore / totalQuestionsProcessed;

        // Adaptive Difficulty State Transitions (Easy -> Medium -> Hard)
        if (questionBaseScore >= 80) {
            if (currentDifficulty === 'Easy') currentDifficulty = 'Medium';
            else if (currentDifficulty === 'Medium') currentDifficulty = 'Hard';
        } else if (questionBaseScore < 50) {
            if (currentDifficulty === 'Hard') currentDifficulty = 'Medium';
            else if (currentDifficulty === 'Medium') currentDifficulty = 'Easy';
        }

        // Early Interview Termination Check (Triggered after 3 low answers)
        if (totalQuestionsProcessed >= 3 && currentRunningAverage < 40) {
            isTerminated = true;
            terminationReason = 'EARLY_TERMINATION_LOW_SCORE';
            break; // Terminate interview processing loop immediately
        }
    }

    // 4. Compute Final Normalized Analysis Data
    const finalCount = totalQuestionsProcessed || 1;
    const skillsAnalysis = {
        accuracy: Math.round(skillsScores.accuracy / finalCount),
        clarity: Math.round(skillsScores.clarity / finalCount),
        depth: Math.round(skillsScores.depth / finalCount),
        relevance: Math.round(skillsScores.relevance / finalCount)
    };

    // Calculate final weighted Readiness Score out of 100
    const finalInterviewReadinessScore = Math.round(cumulativeScore / finalCount);

    // 5. Generate Hiring Recommendations & Dynamic Feedback
    let hiringReadinessCategory = 'Average';
    if (finalInterviewReadinessScore >= 80) {
        hiringReadinessCategory = 'Strong';
        strengths.push("Maintained conceptual accuracy under high difficulty scaling", "Strong articulation pacing");
        weaknesses.push("Minor optimization cleanups needed in deep architecture branches");
    } else if (finalInterviewReadinessScore < 50) {
        hiringReadinessCategory = 'Needs Improvement';
        strengths.push("Attempted core constraint paths");
        weaknesses.push("Overall logical accuracy fell below system runtime baseline", "Struggled with timing limits");
    } else {
        hiringReadinessCategory = 'Average';
        strengths.push("Steady consistency throughout baseline scenarios");
        weaknesses.push("Needs to scale evaluation depth for edge-case prompts");
    }

    // 6. Return exact data structural schema expected by the Dashboard UI
    res.json({
      finalInterviewReadinessScore,
      hiringReadinessCategory,
      terminationReason,
      totalQuestionsProcessed,
      skillsAnalysis,
      feedback: {
          strengths: strengths,
          weaknesses: weaknesses,
          actionableInsight: `Focus on stabilizing answers under strict ${currentDifficulty} runtime environments.`
      }
    });
    
  } catch (error) {
    console.error('Error processing interview:', error);
    res.status(500).json({
      error: 'Internal server error while evaluating interview'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 POST endpoint: http://localhost:${PORT}/evaluate-interview`);
});

module.exports = app;



