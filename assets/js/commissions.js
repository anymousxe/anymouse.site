document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('commish-form')
    const btn = document.getElementById('submit-btn')
    const status = document.getElementById('form-status')

    form.addEventListener('submit', async (e) => {
        e.preventDefault()

        // honeypot
        if (form.website.value) return

        const data = {
            name: form.name.value.trim(),
            contact: form.contact.value.trim(),
            type: form.type.value,
            budget: form.budget.value.trim(),
            details: form.details.value.trim(),
        }

        if (!data.name || !data.contact || !data.type || !data.details) {
            setStatus('fill out the required fields.', 'error')
            return
        }

        btn.disabled = true
        const label = btn.querySelector('.btn-label')
        const oldLabel = label.textContent
        label.textContent = 'sending...'
        setStatus('')

        try {
            const res = await fetch('/api/commission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error || 'something went wrong')
            }

            form.reset()
            setStatus('sent. i\'ll get back to you soon.', 'success')
        } catch (err) {
            setStatus(err.message || 'failed to send. try again or hit me on discord.', 'error')
        } finally {
            label.textContent = oldLabel
            btn.disabled = false
        }
    })

    function setStatus(msg, cls = '') {
        status.textContent = msg
        status.className = 'form-status' + (cls ? ' ' + cls : '')
    }

    // copy wallet
    const copyBtn = document.getElementById('copy-wallet')
    const wallet = document.getElementById('wallet')
    if (copyBtn && wallet) {
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(wallet.textContent.trim())
                const icon = copyBtn.querySelector('i, svg')
                const orig = copyBtn.innerHTML
                copyBtn.innerHTML = '<i data-lucide="check"></i>'
                if (typeof lucide !== 'undefined') lucide.createIcons()
                setTimeout(() => {
                    copyBtn.innerHTML = orig
                    if (typeof lucide !== 'undefined') lucide.createIcons()
                }, 1500)
            } catch (e) {}
        })
    }
})
