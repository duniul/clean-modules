const { getInfo } = require('@changesets/get-github-info');

const REPO = 'duniul/clean-modules';

const kaomojis = ['d(°∀° d)', '(b ᵔ▽ᵔ)b', '(=⌒‿‿⌒=)', '(ˆ(oo)ˆ)', '( ͡° ͜ʖ ͡°)', '( ͡° ʖ̯ ͡°)', '( ͠° ͟ʖ ͡°)', '( ͡ᵔ ͜ʖ ͡ᵔ)', '( ఠ ͟ʖ ఠ)'];

function getSurpriseKaomoji() {
  const randomIndex = Math.floor(Math.random() * (kaomojis.length - 1));
  return kaomojis[randomIndex];
}

function formatSummary(summary) {
  let formatted = summary.trim();
  formatted = formatted[0].toUpperCase() + formatted.slice(1); // capitalize first char
  formatted = formatted.replace(/\.$/, ''); // remove trailing periods

  return formatted;
}

function formatSuffix(links) {
  const { pull, user } = links;
  const linkParts = [pull, user].filter(Boolean);

  if (!linkParts.length) {
    return '';
  }

  return `(${linkParts.join(', ')})`;
}

async function getGithubInfo(props) {
  return getInfo({ repo: REPO, ...props });
}

async function getReleaseLine(changeset) {
  const { links } = await getGithubInfo({ commit: changeset.commit });
  const [firstLine, ...otherLines] = changeset.summary.split('\n');

  const commitPrefix = links.commit || `<code title="Missing commit!">${getSurpriseKaomoji()}</code>`;
  const summaryLine = ['-', commitPrefix, formatSummary(firstLine), formatSuffix(links)].join(' ');

  return [summaryLine, ...otherLines].join('\n');
}

async function getDependencyReleaseLine(changesets, updatedDeps) {
  if (!updatedDeps.length) {
    return '';
  }

  const commitLinks = await Promise.all(
    changesets.map(async ({ commit }) => {
      if (commit) {
        const { links } = await getGithubInfo({ commit });
        return links.commit;
      }
    })
  );

  const content =
    '### Updated Dependencies\n' +
    `- ${commitLinks.join(' ')}\n` +
    `${updatedDeps.map((dep) => `  - \`${dep.name}@${dep.newVersion}\``).join('\n')}`;

  return content;
}

module.exports = {
  getReleaseLine,
  getDependencyReleaseLine,
};
