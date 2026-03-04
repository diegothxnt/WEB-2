function resolveValue(value){
    if (typeof value === "string"){
        const envMatch = value.match(/^\$\{([^:}]+)(?::([^}]+))?\}$/);
        if (envMatch) {
            const key = envMatch[1];
            const def = envMatch[2];
            return process.env[key];
        }
        return value;
    }
    if (Array.isArray(value)) return value.map(resolveValue);
    if (value && typeof value === "object") {
        const out = {};
        for (const k of Object.keys(value)) out[k] = resolveValue(value[k]);
        return out;
    }
    return value;
}

export default resolveValue;