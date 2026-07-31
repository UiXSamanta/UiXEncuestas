// Script para actualizar la lógica condicional de la encuesta 03acdef0-eb91-452b-8101-75e68d78768f
// Este script cambia todos los saltos a pregunta 12 por END_SURVEY

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SURVEY_ID = '03acdef0-eb91-452b-8101-75e68d78768f';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixSurveyLogic() {
  console.log('🔧 Fixing survey logic for:', SURVEY_ID);
  console.log('━'.repeat(60));

  // 1. Fetch the survey
  const { data: survey, error: fetchError } = await supabase
    .from('kv_store_824603ba')
    .select('value')
    .eq('key', `encuesta_${SURVEY_ID}`)
    .single();

  if (fetchError || !survey) {
    console.error('❌ Error fetching survey:', fetchError);
    process.exit(1);
  }

  const encuestaData = JSON.parse(survey.value);
  console.log(`✅ Survey loaded: "${encuestaData.nombre_encuesta}"`);
  console.log(`📊 Total questions: ${encuestaData.preguntas.length}`);
  console.log('━'.repeat(60));

  // 2. Find and update invalid rules
  let updatedCount = 0;

  encuestaData.preguntas.forEach((pregunta: any, index: number) => {
    const questionNumber = index + 1;

    if (!pregunta.conditional_logic || pregunta.conditional_logic.length === 0) {
      return;
    }

    const updatedLogic = pregunta.conditional_logic.map((logic: any) => {
      // Find the target question
      const targetIndex = encuestaData.preguntas.findIndex(
        (q: any) => q.pregunta_id === logic.jump_to_question_id
      );
      const targetNumber = targetIndex + 1;

      // Check if this is a backward jump to question 12
      if (targetNumber === 12 && questionNumber > 12) {
        console.log(`🔄 Question ${questionNumber}: "${pregunta.titulo_pregunta}"`);
        console.log(`   Option [${logic.option_index}]: "${pregunta.opciones?.[logic.option_index] || 'unknown'}"`);
        console.log(`   Old: Jump to question ${targetNumber}`);
        console.log(`   New: END_SURVEY (Finalizar formulario)`);
        console.log('');

        updatedCount++;

        return {
          ...logic,
          jump_to_question_id: 'END_SURVEY',
        };
      }

      return logic;
    });

    pregunta.conditional_logic = updatedLogic;
  });

  if (updatedCount === 0) {
    console.log('ℹ️  No rules needed updating');
    return;
  }

  console.log('━'.repeat(60));
  console.log(`✅ Updated ${updatedCount} conditional logic rule${updatedCount > 1 ? 's' : ''}`);
  console.log('━'.repeat(60));

  // 3. Save the updated survey
  const { error: updateError } = await supabase
    .from('kv_store_824603ba')
    .update({
      value: JSON.stringify(encuestaData),
      updated_at: new Date().toISOString(),
    })
    .eq('key', `encuesta_${SURVEY_ID}`);

  if (updateError) {
    console.error('❌ Error updating survey:', updateError);
    process.exit(1);
  }

  console.log('✅ Survey saved successfully!');
  console.log('');
  console.log('📝 Next steps:');
  console.log('   1. Refresh the survey editor to see the changes');
  console.log('   2. Test the survey by responding to it');
  console.log('   3. Verify that each section now ends the survey properly');
  console.log('');
}

fixSurveyLogic().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
