import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
import {
  PRIMARY_ADMIN_EMAIL,
  PRODUCTION_SITE_URL,
  resolveCorsOrigin,
  persistAdminWithoutTempPassword,
  requireAdmin,
  requirePermission,
  stripAdminSecrets,
  stripProyectoSecrets,
  stripTrashSecrets,
} from "./auth.ts";
import { generateTempPassword, hashSecret, isHashedSecret, verifySecret } from "./passwords.ts";
import { deleteResponsesForSurvey, getResponsesForSurvey, responseKey } from "./response_keys.ts";
import { enforceRateLimit } from "./rate_limit.ts";

const app = new Hono();

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

console.log("🚀 Server starting...");

// ==================== STORAGE BUCKET SETUP ====================
const IMAGES_BUCKET = "make-824603ba-images";

(async () => {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === IMAGES_BUCKET);
    if (!bucketExists) {
      const { error } = await supabaseAdmin.storage.createBucket(IMAGES_BUCKET, {
        public: true, // Survey background images must be publicly accessible
      });
      if (error) {
        // Ignore 409 conflict errors - means bucket already exists (race condition)
        if (error.statusCode === '409' || error.status === 409) {
          console.log(`✅ Storage bucket "${IMAGES_BUCKET}" already exists (verified via error)`);
        } else {
          console.error("❌ Error creating images bucket:", error);
        }
      } else {
        console.log(`✅ Storage bucket "${IMAGES_BUCKET}" created successfully`);
      }
    } else {
      console.log(`✅ Storage bucket "${IMAGES_BUCKET}" already exists (verified via list)`);
    }
  } catch (err) {
    // Ignore errors that indicate the bucket already exists
    if (err?.statusCode === '409' || err?.status === 409 || err?.message?.includes('already exists')) {
      console.log(`✅ Storage bucket "${IMAGES_BUCKET}" already exists (caught in exception)`);
    } else {
      console.error("❌ Bucket setup error:", err);
    }
  }
})();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: (origin) => resolveCorsOrigin(origin),
    allowHeaders: ["Content-Type", "Authorization", "apikey", "x-client-info"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-824603ba/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== OG PREVIEW ROUTE ====================
// Returns server-rendered HTML with per-survey Open Graph meta tags.
// Share this URL on social media for correct link previews:
//   https://<project>.supabase.co/functions/v1/make-server-824603ba/og/<surveyId>
// Real users are redirected instantly to the actual survey page.

app.get("/make-server-824603ba/og/:id", async (c) => {
  const id = c.req.param("id");
  const SITE_URL = (Deno.env.get("SITE_URL") ?? PRODUCTION_SITE_URL).replace(/\/$/, "");

  try {
    const encuesta = await kv.get(`encuesta:${id}`);

    if (!encuesta) {
      return c.html(`<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${SITE_URL}/survey/${id}"/></head><body><script>location.href='${SITE_URL}/survey/${id}'</script></body></html>`);
    }

    const titulo = encuesta.pantalla_bienvenida?.titulo || encuesta.nombre_encuesta || "Encuesta";
    const descripcion = encuesta.pantalla_bienvenida?.descripcion || "Comparte tu opinión y ayúdanos a mejorar.";
    const ogImage = (encuesta.pantalla_bienvenida?.opengraph_enabled === true && encuesta.pantalla_bienvenida?.opengraph_url)
      ? encuesta.pantalla_bienvenida.opengraph_url
      : null;
    const surveyUrl = `${SITE_URL}/survey/${id}`;

    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${esc(titulo)}</title>
  <meta name="description" content="${esc(descripcion)}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${esc(surveyUrl)}" />
  <meta property="og:title" content="${esc(titulo)}" />
  <meta property="og:description" content="${esc(descripcion)}" />
  ${ogImage ? `<meta property="og:image" content="${esc(ogImage)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />` : ""}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}" />
  <meta name="twitter:title" content="${esc(titulo)}" />
  <meta name="twitter:description" content="${esc(descripcion)}" />
  ${ogImage ? `<meta name="twitter:image" content="${esc(ogImage)}" />` : ""}

  <!-- Instant redirect for real users -->
  <meta http-equiv="refresh" content="0;url=${esc(surveyUrl)}" />
</head>
<body>
  <script>window.location.replace("${surveyUrl.replace(/"/g, '\\"')}");</script>
  <p>Redirigiendo a la encuesta... <a href="${esc(surveyUrl)}">Haz clic aquí si no eres redirigido.</a></p>
</body>
</html>`;

    return c.html(html, 200);
  } catch (error) {
    console.error("Error in /og/:id:", error);
    return c.html(`<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${SITE_URL}/survey/${id}"/></head><body><script>location.href='${SITE_URL}/survey/${id}'</script></body></html>`, 500);
  }
});

// setup-admin was a public backdoor that reset the super-admin password. Removed.

// ==================== ENCUESTAS (Surveys) ROUTES ====================

// Get all surveys
app.get("/make-server-824603ba/encuestas", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const encuestas = await kv.getByPrefix("encuesta:");
    return c.json({ data: encuestas, error: null });
  } catch (error) {
    console.error("Error fetching encuestas:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Get single survey by ID
app.get("/make-server-824603ba/encuestas/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const encuesta = await kv.get(`encuesta:${id}`);

    if (!encuesta) {
      return c.json({ data: null, error: "Encuesta no encontrada" }, 404);
    }

    const isLive = encuesta.estado === true;
    if (!isLive) {
      const auth = await requireAdmin(c);
      if (auth.error) {
        return c.json({ data: null, error: "Encuesta no encontrada" }, 404);
      }
    }

    return c.json({ data: encuesta, error: null });
  } catch (error) {
    console.error("Error fetching encuesta:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Create or update survey (upsert)
app.post("/make-server-824603ba/encuestas", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const body = await c.req.json();
    const { id, _token: _ignored, ...encuestaData } = body;
    
    if (!id) {
      return c.json({ data: null, error: "ID es requerido" }, 400);
    }

    const timestamp = new Date().toISOString();
    const existingEncuesta = await kv.get(`encuesta:${id}`);
    
    const encuesta = {
      id,
      ...encuestaData,
      created_at: existingEncuesta?.created_at || timestamp,
      updated_at: encuestaData.updated_at || timestamp,
      updated_by: encuestaData.updated_by ?? existingEncuesta?.updated_by ?? null,
    };

    await kv.set(`encuesta:${id}`, encuesta);
    
    return c.json({ data: encuesta, error: null });
  } catch (error) {
    console.error("Error saving encuesta:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Update survey
app.put("/make-server-824603ba/encuestas/:id", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const id = c.req.param("id");
    const body = await c.req.json();
    const { _token: _ignored, ...safeBody } = body;

    const existingEncuesta = await kv.get(`encuesta:${id}`);

    if (!existingEncuesta) {
      return c.json({ data: null, error: "Encuesta no encontrada" }, 404);
    }

    const updatedEncuesta = {
      ...existingEncuesta,
      ...safeBody,
      id,
      updated_at: safeBody.updated_at || new Date().toISOString(),
      updated_by: safeBody.updated_by ?? existingEncuesta.updated_by ?? null,
    };

    await kv.set(`encuesta:${id}`, updatedEncuesta);
    
    return c.json({ data: updatedEncuesta, error: null });
  } catch (error) {
    console.error("Error updating encuesta:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Delete survey
app.delete("/make-server-824603ba/encuestas/:id", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const id = c.req.param("id");
    await kv.del(`encuesta:${id}`);

    return c.json({ data: { id }, error: null });
  } catch (error) {
    console.error("Error deleting encuesta:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Fix conditional logic for a specific survey
// Converts all backward jumps to question 12 into END_SURVEY
app.post("/make-server-824603ba/encuestas/:id/fix-logic", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const id = c.req.param("id");
    const encuesta = await kv.get(`encuesta:${id}`);

    if (!encuesta) {
      return c.json({ data: null, error: "Encuesta no encontrada" }, 404);
    }

    console.log(`🔧 Fixing conditional logic for survey: ${id}`);
    console.log(`📊 Survey: "${encuesta.nombre_encuesta}"`);
    console.log(`📝 Total questions: ${encuesta.preguntas?.length || 0}`);

    let updatedCount = 0;
    const updates: any[] = [];

    encuesta.preguntas?.forEach((pregunta: any, index: number) => {
      const questionNumber = index + 1;

      if (!pregunta.conditional_logic || pregunta.conditional_logic.length === 0) {
        return;
      }

      const updatedLogic = pregunta.conditional_logic.map((logic: any) => {
        // Find the target question
        const targetIndex = encuesta.preguntas.findIndex(
          (q: any) => q.pregunta_id === logic.jump_to_question_id
        );
        const targetNumber = targetIndex + 1;

        // Check if this is a backward jump to question 12 (or any backward jump)
        if (targetNumber === 12 && questionNumber > 12) {
          updates.push({
            questionNumber,
            questionTitle: pregunta.titulo_pregunta,
            optionIndex: logic.option_index,
            optionText: pregunta.opciones?.[logic.option_index] || 'unknown',
            oldTarget: targetNumber,
            newTarget: 'END_SURVEY',
          });

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
      return c.json({
        data: {
          message: 'No invalid rules found to fix',
          updatedCount: 0,
          updates: [],
        },
        error: null,
      });
    }

    // Save the updated survey
    const updatedEncuesta = {
      ...encuesta,
      updated_at: new Date().toISOString(),
    };

    await kv.set(`encuesta:${id}`, updatedEncuesta);

    console.log(`✅ Fixed ${updatedCount} invalid rule${updatedCount > 1 ? 's' : ''}`);
    updates.forEach((update) => {
      console.log(`   Q${update.questionNumber} [${update.optionIndex}] "${update.optionText}": ${update.oldTarget} → ${update.newTarget}`);
    });

    return c.json({
      data: {
        message: `Successfully fixed ${updatedCount} invalid conditional logic rule${updatedCount > 1 ? 's' : ''}`,
        updatedCount,
        updates,
      },
      error: null,
    });

  } catch (error) {
    console.error("Error fixing conditional logic:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// ==================== RESPUESTAS (Responses) ROUTES ====================

// Save survey response
app.post("/make-server-824603ba/respuestas", async (c) => {
  try {
    const limited = await enforceRateLimit(c, "respuestas", 30, 60_000);
    if (limited) return limited;

    const body = await c.req.json();
    const { encuesta_id, respuestas } = body;
    
    if (!encuesta_id || !respuestas) {
      return c.json({ data: null, error: "encuesta_id y respuestas son requeridos" }, 400);
    }

    const encuesta = await kv.get(`encuesta:${encuesta_id}`);
    if (!encuesta || encuesta.estado !== true) {
      return c.json({ data: null, error: "Encuesta no disponible" }, 404);
    }

    const responseId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    const respuesta = {
      id: responseId,
      encuesta_id,
      respuestas,
      created_at: timestamp,
    };

    await kv.set(responseKey(encuesta_id, responseId), respuesta);

    encuesta.conteo_respuestas = (encuesta.conteo_respuestas || 0) + 1;
    await kv.set(`encuesta:${encuesta_id}`, encuesta);
    
    return c.json({ data: respuesta, error: null });
  } catch (error) {
    console.error("Error saving respuesta:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Get responses for a survey
app.get("/make-server-824603ba/respuestas/:encuesta_id", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const encuesta_id = c.req.param("encuesta_id");
    const filteredResponses = await getResponsesForSurvey(encuesta_id);

    return c.json({ data: filteredResponses, error: null });
  } catch (error) {
    console.error("Error fetching respuestas:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Delete all responses for a survey
app.delete("/make-server-824603ba/respuestas/:encuesta_id", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const encuesta_id = c.req.param("encuesta_id");
    const deleted = await deleteResponsesForSurvey(encuesta_id);

    const encuesta = await kv.get(`encuesta:${encuesta_id}`);
    if (encuesta) {
      encuesta.conteo_respuestas = 0;
      await kv.set(`encuesta:${encuesta_id}`, encuesta);
    }

    console.log(`✅ Deleted ${deleted} responses for encuesta ${encuesta_id}`);

    return c.json({ data: { deleted }, error: null });
  } catch (error) {
    console.error("Error deleting respuestas:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// ==================== PROYECTOS (Projects) ROUTES ====================

// Get all projects
app.get("/make-server-824603ba/proyectos", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const proyectos = await kv.getByPrefix("proyecto:");
    return c.json({ data: proyectos.map(stripProyectoSecrets), error: null });
  } catch (error) {
    console.error("Error fetching proyectos:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Get single project by ID
app.get("/make-server-824603ba/proyectos/:id", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const id = c.req.param("id");
    const proyecto = await kv.get(`proyecto:${id}`);

    if (!proyecto) {
      return c.json({ data: null, error: "Proyecto no encontrado" }, 404);
    }

    return c.json({ data: stripProyectoSecrets(proyecto), error: null });
  } catch (error) {
    console.error("Error fetching proyecto:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Create new project
app.post("/make-server-824603ba/proyectos", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const body = await c.req.json();
    const { id, nombre, password, locked } = body;

    if (!id || !nombre) {
      return c.json({ data: null, error: "ID y nombre son requeridos" }, 400);
    }

    const allProyectos = await kv.getByPrefix("proyecto:");
    const duplicateName = allProyectos.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());

    if (duplicateName) {
      return c.json({ data: null, error: "Ya existe un proyecto con este nombre" }, 400);
    }

    const timestamp = new Date().toISOString();
    const hashedPassword = password ? await hashSecret(password) : null;

    const proyecto = {
      id,
      nombre,
      locked: locked || false,
      password: hashedPassword,
      created_by: auth.user.id,
      encuestas: [],
      created_at: timestamp,
      updated_at: timestamp,
    };

    await kv.set(`proyecto:${id}`, proyecto);

    return c.json({ data: stripProyectoSecrets(proyecto), error: null });
  } catch (error) {
    console.error("Error creating proyecto:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Update project
app.put("/make-server-824603ba/proyectos/:id", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const id = c.req.param("id");
    const body = await c.req.json();
    const { _token: _ignored, password, ...safeBody } = body;

    const existingProyecto = await kv.get(`proyecto:${id}`);

    if (!existingProyecto) {
      return c.json({ data: null, error: "Proyecto no encontrado" }, 404);
    }

    if (safeBody.nombre && safeBody.nombre.toLowerCase() !== existingProyecto.nombre.toLowerCase()) {
      const allProyectos = await kv.getByPrefix("proyecto:");
      const duplicateName = allProyectos.find(p =>
        p.id !== id && p.nombre.toLowerCase() === safeBody.nombre.toLowerCase()
      );

      if (duplicateName) {
        return c.json({ data: null, error: "Ya existe un proyecto con este nombre" }, 400);
      }
    }

    let nextPassword = existingProyecto.password;
    if (password === null) {
      nextPassword = null;
    } else if (typeof password === "string" && password.length > 0) {
      nextPassword = await hashSecret(password);
    }

    const updatedProyecto = {
      ...existingProyecto,
      ...safeBody,
      id,
      password: nextPassword,
      updated_at: new Date().toISOString(),
    };

    await kv.set(`proyecto:${id}`, updatedProyecto);

    return c.json({ data: stripProyectoSecrets(updatedProyecto), error: null });
  } catch (error) {
    console.error("Error updating proyecto:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Delete project
app.delete("/make-server-824603ba/proyectos/:id", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const id = c.req.param("id");
    await kv.del(`proyecto:${id}`);

    return c.json({ data: { id }, error: null });
  } catch (error) {
    console.error("Error deleting proyecto:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Duplicate project
app.post("/make-server-824603ba/proyectos/:id/duplicate", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const id = c.req.param("id");
    const body = await c.req.json();
    const { newName } = body;

    const existingProyecto = await kv.get(`proyecto:${id}`);

    if (!existingProyecto) {
      return c.json({ data: null, error: "Proyecto no encontrado" }, 404);
    }

    const allProyectos = await kv.getByPrefix("proyecto:");
    const duplicateName = allProyectos.find(p => p.nombre.toLowerCase() === newName.toLowerCase());

    if (duplicateName) {
      return c.json({ data: null, error: "Ya existe un proyecto con este nombre" }, 400);
    }

    const newId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const newProyecto = {
      ...existingProyecto,
      id: newId,
      nombre: newName,
      encuestas: [],
      created_by: auth.user.id,
      created_at: timestamp,
      updated_at: timestamp,
    };

    await kv.set(`proyecto:${newId}`, newProyecto);

    return c.json({ data: stripProyectoSecrets(newProyecto), error: null });
  } catch (error) {
    console.error("Error duplicating proyecto:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Check if user is creator of project (no password required)
app.post("/make-server-824603ba/proyectos/:id/check-access", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const id = c.req.param("id");

    const proyecto = await kv.get(`proyecto:${id}`);

    if (!proyecto) {
      return c.json({ data: null, error: "Proyecto no encontrado" }, 404);
    }

    const isCreator = !!proyecto.created_by && proyecto.created_by === auth.user.id;
    const hasPassword = !!proyecto.password;

    return c.json({
      data: {
        isCreator,
        hasPassword,
        requiresPassword: hasPassword && !isCreator
      },
      error: null
    });
  } catch (error) {
    console.error("Error checking project access:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Validate project password
app.post("/make-server-824603ba/proyectos/:id/validate-password", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const id = c.req.param("id");
    const body = await c.req.json();
    const { password } = body;

    const proyecto = await kv.get(`proyecto:${id}`);

    if (!proyecto) {
      return c.json({ data: null, error: "Proyecto no encontrado" }, 404);
    }

    const isCreator = !!proyecto.created_by && proyecto.created_by === auth.user.id;

    if (isCreator) {
      return c.json({ data: { valid: true, isCreator: true }, error: null });
    }

    const isValid = await verifySecret(password || "", proyecto.password);

    if (isValid && proyecto.password && !isHashedSecret(proyecto.password)) {
      proyecto.password = await hashSecret(password);
      await kv.set(`proyecto:${id}`, proyecto);
    }

    return c.json({ data: { valid: isValid, isCreator: false }, error: null });
  } catch (error) {
    console.error("Error validating password:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// ==================== TRASH ROUTES ====================

// Move item to trash
app.post("/make-server-824603ba/trash", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const body = await c.req.json();
    const { type, id } = body;

    if (!type || !id) {
      return c.json({ data: null, error: "type e id son requeridos" }, 400);
    }

    const trashId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const deleteAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(); // 15 days

    let item;
    if (type === 'proyecto') {
      item = await kv.get(`proyecto:${id}`);
      if (item) await kv.del(`proyecto:${id}`);
    } else if (type === 'encuesta') {
      item = await kv.get(`encuesta:${id}`);
      if (item) await kv.del(`encuesta:${id}`);
    }

    if (!item) {
      return c.json({ data: null, error: "Item no encontrado" }, 404);
    }

    const trashItem = {
      id: trashId,
      type,
      originalId: id,
      data: item,
      deleted_at: timestamp,
      delete_at: deleteAt,
    };

    await kv.set(`trash:${trashId}`, trashItem);

    return c.json({ data: stripTrashSecrets(trashItem), error: null });
  } catch (error) {
    console.error("Error moving to trash:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Get all trash items
app.get("/make-server-824603ba/trash", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const trashItems = await kv.getByPrefix("trash:");

    // Auto-delete items older than 15 days
    const now = new Date().getTime();
    const itemsToDelete = trashItems.filter(item => {
      const deleteTime = new Date(item.delete_at).getTime();
      return now >= deleteTime;
    });

    for (const item of itemsToDelete) {
      await kv.del(`trash:${item.id}`);
    }

    const validItems = trashItems.filter(item => {
      const deleteTime = new Date(item.delete_at).getTime();
      return now < deleteTime;
    });

    return c.json({ data: validItems.map(stripTrashSecrets), error: null });
  } catch (error) {
    console.error("Error fetching trash:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Restore item from trash
app.post("/make-server-824603ba/trash/:id/restore", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const id = c.req.param("id");
    const trashItem = await kv.get(`trash:${id}`);

    if (!trashItem) {
      return c.json({ data: null, error: "Item no encontrado en papelera" }, 404);
    }

    const { type, originalId, data } = trashItem;

    if (type === 'proyecto') {
      await kv.set(`proyecto:${originalId}`, data);
    } else if (type === 'encuesta') {
      await kv.set(`encuesta:${originalId}`, data);
    }

    await kv.del(`trash:${id}`);

    return c.json({ data: { restored: true }, error: null });
  } catch (error) {
    console.error("Error restoring from trash:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Permanently delete item from trash
app.delete("/make-server-824603ba/trash/:id", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const id = c.req.param("id");
    await kv.del(`trash:${id}`);

    return c.json({ data: { id }, error: null });
  } catch (error) {
    console.error("Error deleting from trash:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// ==================== AUTH ROUTES ====================

app.post("/make-server-824603ba/auth/signup", async (c) => {
  try {
    const auth = await requirePermission(c, "settings");
    if (auth.error) return auth.error;

    const body = await c.req.json();
    const { email, name, role, can_access_notifications, can_access_settings } = body;

    if (!email) {
      return c.json({ data: null, error: "Email es requerido" }, 400);
    }

    const tempPassword = generateTempPassword();

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      user_metadata: { name: name || email, must_change_password: true },
      email_confirm: true
    });

    if (error) {
      console.error("Error creating user:", error);
      return c.json({ data: null, error: error.message }, 400);
    }

    await kv.set(`admin:${data.user.id}`, {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || email,
      role: role || 'Administrador',
      can_access_notifications: can_access_notifications === true,
      can_access_settings: can_access_settings === true,
      must_change_password: true,
      created_at: new Date().toISOString(),
    });

    return c.json({
      data: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || email,
        temp_password: tempPassword,
      },
      error: null
    });
  } catch (error) {
    console.error("Error in signup:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

app.post("/make-server-824603ba/auth/admins", async (c) => {
  try {
    const auth = await requirePermission(c, "settings");
    if (auth.error) return auth.error;

    const admins = await kv.getByPrefix("admin:");
    const sanitized = [];
    for (const admin of admins) {
      sanitized.push(await persistAdminWithoutTempPassword(admin));
    }
    return c.json({ data: sanitized.map(stripAdminSecrets), error: null });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

app.put("/make-server-824603ba/auth/admins/:id", async (c) => {
  try {
    const auth = await requirePermission(c, "settings");
    if (auth.error) return auth.error;

    const adminId = c.req.param("id");
    const body = await c.req.json();
    const { name, role, can_access_notifications, can_access_settings } = body;

    const currentAdmin = await kv.get(`admin:${adminId}`);
    if (!currentAdmin) {
      return c.json({ data: null, error: "Usuario no encontrado" }, 404);
    }

    const updatedAdmin = {
      ...currentAdmin,
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role }),
      ...(can_access_notifications !== undefined && { can_access_notifications }),
      ...(can_access_settings !== undefined && { can_access_settings }),
      updated_at: new Date().toISOString(),
    };
    delete updatedAdmin.temp_password;

    await kv.set(`admin:${adminId}`, updatedAdmin);

    if (name !== undefined) {
      await supabaseAdmin.auth.admin.updateUserById(adminId, {
        user_metadata: { name }
      });
    }

    return c.json({ data: stripAdminSecrets(updatedAdmin), error: null });
  } catch (error) {
    console.error("Error updating admin:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

app.post("/make-server-824603ba/auth/admins/:id/reset-password", async (c) => {
  try {
    const auth = await requirePermission(c, "settings");
    if (auth.error) return auth.error;

    const adminId = c.req.param("id");
    const adminData = await kv.get(`admin:${adminId}`);
    if (!adminData) {
      return c.json({ data: null, error: "Usuario no encontrado" }, 404);
    }

    const newTempPassword = generateTempPassword();

    const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(adminId, {
      password: newTempPassword,
      user_metadata: { name: adminData.name, must_change_password: true },
    });
    if (pwError) {
      return c.json({ data: null, error: pwError.message }, 500);
    }

    const { temp_password: _ignored, ...rest } = adminData;
    const updatedAdmin = {
      ...rest,
      must_change_password: true,
      updated_at: new Date().toISOString(),
    };
    await kv.set(`admin:${adminId}`, updatedAdmin);

    await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: adminData.email,
    }).catch((e: any) => console.warn("Could not send reset email:", e.message));

    return c.json({ data: { temp_password: newTempPassword }, error: null });
  } catch (error) {
    const msg = (error as any)?.message || 'Error interno al resetear contraseña';
    console.error("Error resetting password:", msg);
    return c.json({ data: null, error: msg }, 500);
  }
});

app.post("/make-server-824603ba/auth/admins/import", async (c) => {
  try {
    const auth = await requirePermission(c, "settings");
    if (auth.error) return auth.error;

    const body = await c.req.json();
    const { rows } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return c.json({ data: null, error: "No hay filas para importar" }, 400);
    }

    const existingAdmins = await kv.getByPrefix("admin:");
    const adminByEmail = new Map(
      existingAdmins
        .filter((admin: any) => admin?.email)
        .map((admin: any) => [String(admin.email).toLowerCase(), admin])
    );

    const results = {
      created: [] as any[],
      updated: [] as any[],
      skipped: [] as any[],
      errors: [] as string[],
    };

    for (const row of rows) {
      const email = String(row?.email || '').trim().toLowerCase();
      const name = String(row?.nombre || row?.name || '').trim();
      const role = String(row?.rol || row?.role || 'Administrador').trim();
      const can_access_notifications = row?.acceso_notificaciones === true;
      const can_access_settings = row?.acceso_configuracion === true;

      if (!email || !name) {
        results.errors.push(`Fila inválida: nombre y email son obligatorios (${email || 'sin email'}).`);
        continue;
      }

      if (email === PRIMARY_ADMIN_EMAIL) {
        results.skipped.push({ email, reason: "Admin principal protegido" });
        continue;
      }

      const existing = adminByEmail.get(email);

      if (existing) {
        const { temp_password: _ignored, ...existingRest } = existing;
        const updatedAdmin = {
          ...existingRest,
          name,
          role,
          can_access_notifications,
          can_access_settings,
          updated_at: new Date().toISOString(),
        };

        await kv.set(`admin:${existing.id}`, updatedAdmin);
        await supabaseAdmin.auth.admin.updateUserById(existing.id, {
          user_metadata: { name },
        });

        adminByEmail.set(email, updatedAdmin);
        results.updated.push({ id: existing.id, email, name });
        continue;
      }

      const tempPassword = generateTempPassword();
      const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        user_metadata: { name, must_change_password: true },
        email_confirm: true,
      });

      if (createError || !createdUser?.user) {
        results.errors.push(`No se pudo crear ${email}: ${createError?.message || 'error desconocido'}`);
        continue;
      }

      const newAdmin = {
        id: createdUser.user.id,
        email: createdUser.user.email,
        name,
        role,
        can_access_notifications,
        can_access_settings,
        must_change_password: true,
        created_at: new Date().toISOString(),
      };

      await kv.set(`admin:${createdUser.user.id}`, newAdmin);
      adminByEmail.set(email, newAdmin);
      results.created.push({
        id: createdUser.user.id,
        email,
        name,
        temp_password: tempPassword,
      });
    }

    return c.json({ data: results, error: null });
  } catch (error) {
    console.error("Error importing admins:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

app.delete("/make-server-824603ba/auth/admins/:id", async (c) => {
  try {
    const auth = await requirePermission(c, "settings");
    if (auth.error) return auth.error;

    const adminId = c.req.param("id");

    if (adminId === auth.user.id) {
      return c.json({ data: null, error: "No puedes eliminar tu propio usuario" }, 400);
    }

    const target = await kv.get(`admin:${adminId}`);
    if (target?.email && String(target.email).toLowerCase() === PRIMARY_ADMIN_EMAIL) {
      return c.json({ data: null, error: "No se puede eliminar al administrador principal" }, 400);
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(adminId);

    if (deleteError) {
      console.error("Error deleting user from auth:", deleteError);
      return c.json({ data: null, error: deleteError.message }, 400);
    }

    await kv.del(`admin:${adminId}`);

    return c.json({ data: { id: adminId }, error: null });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

app.post("/make-server-824603ba/auth/verify", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const adminInfo = auth.admin;

    return c.json({
      data: {
        id: auth.user.id,
        email: auth.user.email || '',
        name: adminInfo?.name || auth.user.email,
        must_change_password: adminInfo?.must_change_password || false,
        can_access_notifications: adminInfo?.can_access_notifications || false,
        can_access_settings: adminInfo?.can_access_settings || false,
        source: adminInfo?.source ?? null,
      },
      error: null
    });
  } catch (error) {
    console.error("Error verifying user:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

app.post("/make-server-824603ba/auth/change-password", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const body = await c.req.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 8) {
      return c.json({ data: null, error: "La contraseña debe tener al menos 8 caracteres" }, 400);
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      auth.user.id,
      {
        password: newPassword,
        user_metadata: { must_change_password: false }
      }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return c.json({ data: null, error: `Error al cambiar contraseña: ${updateError.message}` }, 500);
    }

    const adminInfo = await kv.get(`admin:${auth.user.id}`);
    if (adminInfo) {
      const { temp_password: _ignored, ...rest } = adminInfo;
      await kv.set(`admin:${auth.user.id}`, {
        ...rest,
        must_change_password: false,
        password_changed_at: new Date().toISOString(),
      });
    }

    return c.json({
      data: {
        message: 'Contraseña actualizada exitosamente',
        must_change_password: false
      },
      error: null
    });

  } catch (error) {
    console.error("Error changing password:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});


// ==================== IMAGE UPLOAD ROUTE ====================

const MAX_IMAGE_SIZE = 204800; // 200 KB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function isPng(bytes: Uint8Array): boolean {
  return bytes.length >= 8
    && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
}

app.post("/make-server-824603ba/upload-image", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return c.json({ data: null, error: "No se proporcionó ningún archivo" }, 400);
    }

    // Validate MIME type (jpg / png only)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return c.json(
        { data: null, error: "Formato no permitido. Solo se aceptan imágenes JPG o PNG." },
        400
      );
    }

    // Validate file size (max 200 KB)
    if (file.size > MAX_IMAGE_SIZE) {
      return c.json(
        { data: null, error: `La imagen supera el límite de 200 KB (tamaño recibido: ${Math.round(file.size / 1024)} KB).` },
        400
      );
    }

    // Build a unique filename: timestamp + sanitized original name
    const ext = file.type === "image/png" ? "png" : "jpg";
    const filename = `survey-bg-${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const validJpeg = file.type === "image/jpeg" && isJpeg(uint8Array);
    const validPng = file.type === "image/png" && isPng(uint8Array);
    if (!validJpeg && !validPng) {
      return c.json(
        { data: null, error: "El archivo no es una imagen JPG o PNG válida." },
        400,
      );
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from(IMAGES_BUCKET)
      .upload(filename, uint8Array, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading image to storage:", uploadError);
      return c.json({ data: null, error: `Error al subir la imagen: ${uploadError.message}` }, 500);
    }

    // Get public URL (bucket is public)
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(IMAGES_BUCKET)
      .getPublicUrl(filename);

    console.log(`✅ Image uploaded: ${filename}`);
    return c.json({ data: { url: publicUrlData.publicUrl }, error: null });
  } catch (error) {
    console.error("Unexpected error in upload-image:", error);
    return c.json({ data: null, error: `Error inesperado: ${error.message}` }, 500);
  }
});

// ==================== NOTIFICATIONS ROUTES ====================

// Helper function to send email (placeholder - needs email service)
async function sendEmail(to: string, subject: string) {
  console.log(`Email queued to: ${to} (${subject})`);
  return { success: true };
}

// Create notification (admin access request)
app.post("/make-server-824603ba/notifications", async (c) => {
  try {
    const limited = await enforceRateLimit(c, "notifications", 5, 60_000);
    if (limited) return limited;

    const body = await c.req.json();
    const id = crypto.randomUUID();
    const notification = {
      id,
      type: body.type || 'admin_request',
      nombre: body.nombre || '',
      apellidos: body.apellidos || '',
      email: body.email || '',
      motivo: body.motivo || '',
      leido: false,
      status: 'pending', // pending, approved, rejected
      created_at: new Date().toISOString(),
    };
    await kv.set(`notification:${id}`, notification);
    console.log(`✅ Notification created: ${id}`);
    return c.json({ data: notification, error: null });
  } catch (error) {
    console.error("Error creating notification:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Get all notifications
app.get("/make-server-824603ba/notifications", async (c) => {
  try {
    const auth = await requirePermission(c, "notifications");
    if (auth.error) return auth.error;

    const notifications = await kv.getByPrefix("notification:");
    return c.json({ data: notifications, error: null });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Mark notification as read
app.put("/make-server-824603ba/notifications/:id/read", async (c) => {
  try {
    const auth = await requirePermission(c, "notifications");
    if (auth.error) return auth.error;

    const id = c.req.param("id");
    const notification = await kv.get(`notification:${id}`);
    if (!notification) {
      return c.json({ data: null, error: "Notificación no encontrada" }, 404);
    }
    notification.leido = true;
    await kv.set(`notification:${id}`, notification);
    console.log(`✅ Notification ${id} marked as read`);
    return c.json({ data: notification, error: null });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Delete notification
app.delete("/make-server-824603ba/notifications/:id", async (c) => {
  try {
    const auth = await requirePermission(c, "notifications");
    if (auth.error) return auth.error;

    const id = c.req.param("id");
    await kv.del(`notification:${id}`);
    console.log(`✅ Notification ${id} deleted`);
    return c.json({ data: { id }, error: null });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Approve access request - Creates new user and sends credentials email
app.post("/make-server-824603ba/notifications/:id/approve", async (c) => {
  try {
    const auth = await requirePermission(c, "notifications");
    if (auth.error) return auth.error;

    const notificationId = c.req.param("id");
    const userId = auth.user.id;

    const notification = await kv.get(`notification:${notificationId}`);
    if (!notification) {
      return c.json({ data: null, error: "Notificación no encontrada" }, 404);
    }

    if (notification.status !== 'pending') {
      return c.json({ data: null, error: "Esta solicitud ya fue procesada" }, 400);
    }

    const autoPassword = generateTempPassword();

    // Create user in Supabase Auth
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: notification.email,
      password: autoPassword,
      email_confirm: true,
      user_metadata: {
        name: `${notification.nombre} ${notification.apellidos}`,
        role: 'admin',
        must_change_password: true, // Force password change on first login
      }
    });

    if (createError) {
      console.error("❌ Error creating user:", createError);
      return c.json({ data: null, error: `Error al crear usuario: ${createError.message}` }, 500);
    }

    console.log(`✅ User created: ${userData.user.id}`);

    // Store admin info in KV store
    await kv.set(`admin:${userData.user.id}`, {
      id: userData.user.id,
      email: userData.user.email,
      name: `${notification.nombre} ${notification.apellidos}`,
      must_change_password: true,
      created_at: new Date().toISOString(),
    });

    console.log(`✅ Admin info stored in KV`);

    // Update notification status
    notification.status = 'approved';
    notification.processed_at = new Date().toISOString();
    notification.processed_by = userId;
    await kv.set(`notification:${notificationId}`, notification);

    await sendEmail(notification.email, '¡Bienvenido! - Credenciales de Acceso');

    return c.json({
      data: {
        user: { id: userData.user.id, email: userData.user.email },
        password: autoPassword,
        notification,
        message: 'Usuario creado exitosamente'
      },
      error: null
    });

  } catch (error) {
    console.error("❌ Error approving access request:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// Reject access request - Sends rejection email
app.post("/make-server-824603ba/notifications/:id/reject", async (c) => {
  try {
    const auth = await requirePermission(c, "notifications");
    if (auth.error) return auth.error;

    const notificationId = c.req.param("id");
    const userId = auth.user.id;

    const notification = await kv.get(`notification:${notificationId}`);
    if (!notification) {
      return c.json({ data: null, error: "Notificación no encontrada" }, 404);
    }

    if (notification.status !== 'pending') {
      return c.json({ data: null, error: "Esta solicitud ya fue procesada" }, 400);
    }

    notification.status = 'rejected';
    notification.processed_at = new Date().toISOString();
    notification.processed_by = userId;
    await kv.set(`notification:${notificationId}`, notification);

    await sendEmail(notification.email, 'Solicitud de Acceso - Información Importante');

    return c.json({
      data: {
        notification,
        message: 'Solicitud rechazada'
      },
      error: null
    });

  } catch (error) {
    console.error("Error rejecting access request:", error);
    return c.json({ data: null, error: error.message }, 500);
  }
});

// ==================== GEMINI AI COMPARADOR ====================

app.post("/make-server-824603ba/ai/compare-surveys", async (c) => {
  try {
    const auth = await requireAdmin(c);
    if (auth.error) return auth.error;

    const body = await c.req.json();
    const { comparacionData } = body;

    if (!comparacionData || comparacionData.length === 0) {
      return c.json({ data: null, error: "No se proporcionaron datos de comparación" }, 400);
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error("❌ GEMINI_API_KEY not configured");
      return c.json({ data: null, error: "GEMINI_API_KEY no está configurada" }, 500);
    }

    // Prepare data summary for Gemini
    const dataSummary = comparacionData.map((stat: any) => ({
      nombre: stat.nombre,
      totalRespuestas: stat.totalRespuestas,
      satisfaccionGeneral: stat.satisfaccionGeneral,
      promedioSUS: stat.promedioSUS,
      promedioCSAT: stat.promedioCSAT,
      promedioLikert: stat.promedioLikert,
      mejorPregunta: stat.mejorPregunta,
      peorPregunta: stat.peorPregunta,
    }));

    const prompt = `Eres un experto analista de UX y datos de encuestas. Analiza las siguientes encuestas y proporciona recomendaciones inteligentes y accionables.

Datos de encuestas:
${JSON.stringify(dataSummary, null, 2)}

Genera exactamente 6-8 recomendaciones en formato JSON con esta estructura:
{
  "recomendaciones": [
    {
      "tipo": "exito" | "advertencia" | "mejora",
      "titulo": "Título breve y directo (máximo 60 caracteres)",
      "descripcion": "Descripción detallada con insights específicos y accionables (máximo 200 caracteres)"
    }
  ]
}

Criterios importantes:
- Identifica la encuesta ganadora y por qué destaca
- Señala alertas de satisfacción baja (< 50%)
- Destaca alto engagement (respuestas superiores al promedio)
- Analiza diferencias significativas entre encuestas
- Para SUS scores: >80 es excelente, 68 es promedio, <60 necesita mejoras
- Usa emojis relevantes al inicio de cada título
- Sé específico con nombres de encuestas y números
- Prioriza insights accionables sobre observaciones genéricas

Responde SOLO con el objeto JSON, sin texto adicional.`;

    console.log("🤖 Calling Gemini API for survey comparison...");

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("❌ Gemini API error response:", errorText);
      console.error("❌ Gemini API status:", geminiResponse.status);
      return c.json({ data: null, error: `Error de Gemini API (${geminiResponse.status}): ${errorText}` }, 500);
    }

    const geminiData = await geminiResponse.json();
    console.log("✅ Gemini API response received");
    console.log("📄 Gemini response structure:", JSON.stringify(geminiData, null, 2));

    // Extract the generated text
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      console.error("❌ No text generated by Gemini");
      console.error("Full response:", JSON.stringify(geminiData, null, 2));
      return c.json({ data: null, error: "No se generó respuesta de IA" }, 500);
    }

    console.log("📝 Generated text:", generatedText);

    // Parse JSON from response (remove markdown code blocks if present)
    let cleanedText = generatedText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/```\n?/g, "");
    }

    const aiAnalysis = JSON.parse(cleanedText);
    
    console.log(`✅ Generated ${aiAnalysis.recomendaciones.length} AI recommendations`);
    return c.json({ data: aiAnalysis.recomendaciones, error: null });

  } catch (error) {
    console.error("❌ Error in AI comparison:", error);
    console.error("❌ Error stack:", error.stack);
    return c.json({ data: null, error: `Error interno: ${error.message}` }, 500);
  }
});

// ==================== SERVER START ====================

Deno.serve(app.fetch);