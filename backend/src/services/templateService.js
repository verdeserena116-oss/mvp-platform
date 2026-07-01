/**
 * Renders a message template by replacing {{variable}} placeholders
 * with values from the lead object.
 *
 * Supported variables: {{name}}, {{company}}, {{jobTitle}}, {{segment}}, {{region}}
 *
 * @param {string} template - the message template
 * @param {Object} lead - lead instance/object with fields to interpolate
 * @returns {string} rendered message
 */
function renderTemplate(template, lead) {
  if (!template) return '';

  const values = {
    name: lead.name || '',
    company: lead.company || '',
    jobTitle: lead.jobTitle || '',
    segment: lead.segment || '',
    region: lead.region || '',
    email: lead.email || '',
  };

  return template.replace(/{{\s*(\w+)\s*}}/g, (match, key) => {
    return values[key] !== undefined ? values[key] : match;
  });
}

module.exports = { renderTemplate };
